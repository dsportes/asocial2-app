// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { $t } from '../src-fw/util'
import { AppExc } from '../src-fw/log'
import { DocDescriptor } from '../src-fw/docDescriptor'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { keyFromB64 } from '../src-fw/b64'
import { $Credential } from '../src-fw/documents'
import { onPushMsg } from '../../src-pwa/register-service-worker'

const encoder = new TextEncoder()

export class DocEnums {
  static m : Map<string, string[]> = new Map()

  static async get (svc: string, org: string, enumName: string) : Promise<string[]> {
    const k = svc + '/' + org + '/' + enumName
    const dd = DocDescriptor.get(svc + '$' + enumName)
    if (dd.enum) return dd.enum
    if (!dd.extenum) return []
    let lst = DocEnums.m.get(k)
    if (lst) return lst
    lst = await getEnum(svc, org, enumName)
    this.m.set(k, lst)
    return lst
  }
}

export class CVKeys {
  static mc: Map<string, Uint8Array> = new Map()
  static mv: Map<string, Uint8Array> = new Map()

  /* Retourne une clé publique de cryptage de configuation */
  static async getCKey (site: string, name: string) : Promise<Uint8Array> {
    let k = CVKeys.mc.get(site + '/' + name)
    if (k) return k
    const op = new AdminOperation('ADMIN$CKey', site)
    op.args.name = name
    const res = await op.post(true)
    const s = res['key']
    if (!s) return null
    k = keyFromB64(s)
    CVKeys.mc.set(site + '/' + name, k)
    return k
  }

  /* Retourne une clé publique de cryptage de configuation */
  static async getVKey (site: string, name: string) : Promise<Uint8Array> {
    let k = CVKeys.mv.get(site + '/' + name)
    if (k) return k
    const op = new AdminOperation('ADMIN$VKey', site)
    op.args.name = name
    const res = await op.post(true)
    const s = res['key']
    if (!s) return null
    k = keyFromB64(s)
    CVKeys.mv.set(site + '/' + name, k)
    return k
  }
}

/*
export type OpArgs = {
  org?: string
  $OP?: string
  SVC?: string
  APIVERSION?: string
  authRecord?: AuthRecord
}
*/

/*
// Retourne l'opérateur servant le service svc pour l'organisation org
export async function opOfSvcOrg (svc: string, org: string) : Promise<string> {
  const orgs = AOperation.orgs
  let e = orgs.get(org)
  if (!e) {
    await AOperation.loadOrg(org)
    e = orgs.get(org)
    if (!e) return ''
  }
  const op = e.get(svc)
  return op || ''
}
*/

export class AOperation {
  // Map de clé site donnant son URL
  static urls : Map<string, string> = new Map()

  // Map - clé: org - valeur Map de clé svc donnant son site
  static orgs : Map<string, Map<string, string>> = new Map()

  static async getSiteUrl (site: string) : Promise<string> {
    if (AOperation.urls.size === 0) {
      const op = new MDOperation('$GetSitesUrls')
      try {
        const res = await op.post()
        for(const site in res.urls) 
          AOperation.urls.set(site, res.urls[site])
      } catch (e) {
        await op.ko(e)
      }
    }
    return AOperation.urls.get(site)
  }

  static async getOrgSvc (org: string) : Promise<Map<string, string>> {
    let e: Map<string, string> = Operation.orgs.get(org)
    if (!e) {
      e = new Map()
      const op = new MDOperation('$GetOrgSvc')
      op.args.org = org
      const res = await op.post()
      const services = res.services || {} // Objet: { svc1: site1, svc2: site2 ...}
      for (const svc in services) e.set(svc, services[svc])
      Operation.orgs.set(org, e)
    }
    return e
  }

  static async getSite (svc: string, org: string) : Promise<string> {
    const e = await AOperation.getOrgSvc(org)
    return e ? e.get(svc) : undefined
  }

  opName: string
  url: string = ''
  controller: AbortController | null = null
  aborted: boolean = false
  background: boolean = false
  args: any = {}

  constructor (opName: string) {
    this.args['opName'] = opName
    this.opName = opName
  }

  async ko (e: any) {
    if (this.background) e.background = true
    await stores.ui.displayExc(e)
  }

  setArgs (args: any) {
    for(const p of Object.keys(args)) this.args[p] = args[p]
  }
}

/* Opération générique ******************************************/
export class OperationG extends AOperation {

  authRecord: AuthRecord = new AuthRecord()
  svc: string

  async getSvcOrgUrl () : Promise<string> {
    const e = await AOperation.getOrgSvc(this.args.org)
    if (!e)
      throw new AppExc(3, 'unknown_org', this.opName, [this.args.org])
    const url = e.get(this.args.svc)
    if (!url)
      throw new AppExc(3, 'unknown_service_for_org', this.opName, [this.args.org, this.args.svc])
    return url
  }

  async getSiteUrl () : Promise<string> {
    const url = AOperation.getSiteUrl(this.args.site)
    if (!url)
      throw new AppExc(3, 'unknown_url_for_site', this.opName, [this.args.site])
    return url
  }

  constructor (opName: string, background?: boolean) {
    super(opName)
    this.background = background || false
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  /* Ajoute au AuthRecord une signature pour ce role / docId */
  async sign (c: $Credential) {
    return await this.authRecord.sign(c)
  }

  /* Si noAuth est true, l'opération N'INCLUE PAS
  la signature du user dans AuthRecord.
  */
  async post (noAuth?: boolean) : Promise<any> {
    const config = stores.config
    const session = stores.session
    try {

      let u = this.args.site ? await this.getSiteUrl() : await this.getSvcOrgUrl()
      if (!u.endsWith('/')) u += '/'
      // this.url = u + 'op/' + (this.args.$OP || this.args.org) + '/' + this.opName
      this.url = u + 'op/'
      if (this.args.svc)
        this.args.APIVERSION = config.K.SERVICES[this.args.svc].api

      session.opStart(this)
      if (!noAuth)
        await this.authRecord.signUser()
      this.args.authRecord = this.authRecord.toObj
      const body = new Uint8Array(encode(this.args))

      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',  // sent request
          'Accept':       'application/octet-stream'   // expected data sent back
        },
        signal: this.controller.signal,
        body
      })
      this.controller = null
      const buf = await response.bytes()
      const obj = decode(buf)
      if (response.status === 200) {
        session.opEnd()
        const ntf = obj['notification']
        if (ntf) {
          if (config.mondebug) console.log('Notification received on operation return')
          await onPushMsg(ntf) // traitement des notifications sur retour d'opération
        }
        return obj
      }
      if (response.status === 400 || response.status === 401) // 400: AppExc - 401: AppExc inattendue
        throw AppExc.fromObj(obj)
      // autres status: 500...
      const txt = new TextDecoder().decode(buf)
      throw new AppExc(8, 'HTTP_500_etc', 'post', ['' + response.status, (u || '?'), txt])
    } catch (e: any) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc(99, 'interrupted', this.opName)
      throw new AppExc(8, 'unexpected_network_service_response', 'post',
        [(this.url || '?'), e.toString()])
    }
  }

}

export class Operation extends OperationG {

  constructor (opName: string, org: string, background?: boolean) {
    super(opName, background)
    const i = opName.indexOf('$')
    this.args.svc = opName.substring(0, i)
    if (!stores.config.K.SERVICES[this.args.svc])
      throw new AppExc(3, 'not_configured_service', opName, [this.svc])
    this.args.org = org
  }
}

export class AdminOperation extends OperationG {

  constructor (opName: string, site: string, background?: boolean) {
    super(opName, background)
    this.args.site = site
  }
}

export const isAdmin = async (site: string) : Promise<boolean> => {
  const op = new AdminOperation('ADMIN$isAdmin', site)
  try {
    const res = await op.post()
    return res['isadmin']
  } catch(e) {
    await op.ko(e)
    return false
  }
}

export const getEnum = async (svc: string, org: string, enumName: string) 
  : Promise<string[]> => { 
  const op = new Operation('$GetEnum', svc, org)
  try {
    op.args.enumName = enumName
    const res = await op.post(true)
    return res['enum'] || []
  } catch(e) {
    await op.ko(e)
    return []
  }
}

export const setEnum = async (svc: string, oper: string, enumName: string, values: string[]) 
  : Promise<boolean> => { 
  const op = new AdminOperation('ADMIN$GetEnum', svc, oper)
  try {
    op.args.enumName = enumName
    op.args.values = values
    const res = await op.post(true)
    return true
  } catch(e) {
    await op.ko(e)
    return false
  }
}

abstract class A2Operation extends AOperation {
  safeStore: string = ''

  urlSafeStore = async () : Promise<string> => {
    const os = AOperation.services
    if (os.size === 0) await AOperation.loadServices()
    const x = os.get('SAFE')
    const u = x?.get(this.safeStore)
    if (!u)
      throw new AppExc(3, 'safeStore_url_not_found', this.opName, [this.safeStore])
    return u
  }

  constructor (opName: string) {
    super(opName)
  }

  async post () : Promise<any>{
    const session = stores.session
    try {
      session.opStart(this)
      if (!this.url)
        this.url = await this.urlSafeStore()
      // this.url += this.opName
      this.controller = new AbortController()
      this.aborted = false

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',  // sent request
          'Accept':       'application/octet-stream'   // expected data sent back
        },
        signal: this.controller.signal,
        body: new Uint8Array(encode(this.args || {}))
      })
      this.controller = null
      const buf = await response.bytes()
      const obj = decode(buf)
      if (response.status === 200) {
        session.opEnd()
        return obj
      }
      if (response.status === 400 || response.status === 401) // 400: AppExc - 401: AppExc inattendue
        throw AppExc.fromObj(obj)
      // autres status: 500...
      const txt = new TextDecoder().decode(buf)
      throw new AppExc(8, 'HTTP_500_etc', 'post', ['' + response.status, (this.url || '?'), txt])
    } catch (e: any) {
      session.opEnd()
      this.controller = null
      if (e instanceof AppExc) throw e
      if (this.aborted) throw new AppExc(99, 'interrupted', this.opName)
      throw new AppExc(8, 'unexpected_network_service_response', 'post',
        [(this.url || '?'), e.toString()])
    }
  }
}

/* Les SafeOperation n'ont pas de AuthRecord"
Le service Safe vérifie les authentifications par les paramètres
comme hp0, hr0, etc.
*/
export class SafeOperation extends A2Operation {
  constructor (opName: string, safeStore: string) {
    super(opName)
    if (!safeStore) this.url = stores.config.K.STDSAFE_URL
    else this.safeStore = safeStore
  }
}

export class MDOperation extends A2Operation {
  constructor (opName: string) {
    super(opName)
    this.url = stores.config.K.MASTERDIR_URL
  }
}

/*
Toute opération requérant la présence d'au moins un credential est sollicitée en passant
en arguments un objet de classe `AuthRecord`, construit par l'application et ayant les propriétés suivantes:
- `userId`: de l'utilisateur.
- `sessionId`: identifiant de session.
- `time`: date-heure en seconde de création du record.
- _challenge_: propriété virtuelle _userId + '/' + time_
- `userSign`: signature par la clé privée de signature de l'utilisateur, du _challenge_.
- `signatures`: objet ayant une propriété par ID de credential inscrit dans le record
  donnant la signature du challenge par la clé privée de signature du credential.
*/
export class AuthRecord {
  svc: string = ''
  args: Object = ''
  userId: string
  sessionId: string
  time: number
  userSign: Uint8Array | null
  // Object par role / docId : [token]
  signatures: Object | null

  get challenge () : Uint8Array { return encoder.encode(this.userId + '/' + this.time) }

  constructor () {
    const sf = stores.safe
    const session = stores.session
    this.userId = sf.userId
    this.sessionId = session.sessionId
    this.time = Date.now()
    this.signatures = null
    this.userSign = null
  }

  async signUser () {
    const sf = stores.safe
    this.userSign = sf.auth && sf.auth.S ?
      await Crypt.sign(keyFromB64(sf.auth.S), this.challenge) : null
  }

  get toObj() {
    return { userId: this.userId, sessionId: this.sessionId, time: this.time,
      signatures: this.signatures, userSign: this.userSign }
  }

  async sign (c: $Credential) : Promise<void> {
    const x = await Crypt.sign(c.privs, this.challenge)
    const sign = new Uint8Array(x)
    if (!this.signatures) this.signatures = {}
    this.signatures[c.docCl + '/' + c.docPk] = [c.credId, sign]
  }

}
