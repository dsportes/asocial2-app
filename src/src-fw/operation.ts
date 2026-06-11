// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, $t } from '../src-fw/util'
import { DocType } from '../src-fw/doctypes'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'
import { keyFromB64 } from '../src-fw/b64'
import { onPushMsg } from '../../src-pwa/register-service-worker'

const encoder = new TextEncoder()

export type OpArgs = {
  org?: string
  $OP?: string
  SVC?: string
  APIVERSION?: string
  authRecord?: AuthRecord
}

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

class AOperation {
  // Map - clé: SVC - valeur Map de clé $OP donnat l'URL
  static services : Map<string, Map<string, string>> = new Map()

  static async loadServices () {
    const os = AOperation.services
    const op = new MDOperation('$GetSvcUrls')
    op.args.lsvc = Array.from(Object.keys(stores.config.K.SERVICES))
    const res = await op.post()
    const urls = res.urls
    if (urls) for(const svc in urls) {
      let e = os.get(svc)
      if (!e) { e = new Map(); os.set(svc, e) }
      const ops = urls[svc]
      for (const op in ops) e.set(op, ops[op])
    }
  }

  // Map - clé: org - valeur Map de clé SVC donnant $OP
  static orgs : Map<string, Map<string, string>> = new Map()

  static async loadOrg (org: string) : Promise<Map<string, string>> {
    const safeop = new MDOperation('$GetOrgSvcs')
    safeop.args.org = org
    const res = await safeop.post()
    const svcs = res.svcs
    const e : Map<string, string> = new Map()
    Operation.orgs.set(org, e)
    if (svcs) for (const svc in svcs) e.set(svc, svcs[svc])
    return e
  }

  opName: string
  url: string = ''
  controller: AbortController | null = null
  aborted: boolean = false
  background: boolean = false
  args: OpArgs | any = {}

  constructor (opName: string) {
    this.args['opName'] = opName
    this.opName = opName
  }

  urlOfSvcOp = async (svc: string, op: string) : Promise<string> => {
    const os = AOperation.services
    if (os.size === 0) await AOperation.loadServices()
    const x = os.get(svc)
    return !x ? '' : (x.get(op) || '')
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
export class Operation extends AOperation {

  authRecord: AuthRecord
  SVC: string

  async GetSvcOrgUrl () : Promise<string> {
    let e = AOperation.orgs.get(this.args.org)
    if (!e) e = await AOperation.loadOrg(this.args.org)
    const $OP = e ? e.get(this.SVC) : ''
    return !$OP ? '' : await this.urlOfSvcOp(this.SVC, $OP)
  }

  constructor (opName: string, SVC: string, org?: string, $OP?: string, background?: boolean) {
    super(opName)
    if (!SVC || (!org && !$OP))
      throw new AppExc(3, 'svc_org_$OP_not_found', this.opName)

    if (org) this.args.org = org
    else if ($OP) this.args.$OP = $OP
    this.background = background || false
    this.SVC = SVC
    this.authRecord = new AuthRecord()
  }

  get label () { return $t('OP_' + this.opName) }

  abort () {
    this.aborted = true
    if (this.controller) this.controller.abort()
  }

  async getBaseUrl () : Promise<string> {
    if (this.args.$OP) {
      const u = await this.urlOfSvcOp(this.SVC, this.args.$OP)
      if (u) return u
      throw new AppExc(3, 'svcopurl_not_found', this.opName, [this.SVC, this.args.$OP])
    } else {
      let e = AOperation.orgs.get(this.args.org)
      if (!e) e = await AOperation.loadOrg(this.args.org)
      const $OP = e ? e.get(this.SVC) : ''
      const u = !$OP ? '' : await this.urlOfSvcOp(this.SVC, $OP)
      if (u) return u
      throw new AppExc(3, 'svcorgurl_not_found', this.opName, [this.args.org, this.SVC])
    }
  }

  /* Ajoute au AuthRecord une signature pour ce role / docId */
  async sign (role: string, docId?: string) {
    return await this.authRecord.sign(this.SVC, this.args.org, role, docId || '')
  }

  /* Si noAuth est true, l'opération N'INCLUE PAS
  la signature du user dans AuthRecord.
  */
  async post (noAuth?: boolean) : Promise<any> {
    const config = stores.config
    const session = stores.session
    try {

      let u = await this.getBaseUrl()
      if (!u.endsWith('/')) u += '/'
      // this.url = u + 'op/' + (this.args.$OP || this.args.org) + '/' + this.opName
      this.url = u + 'op/' + this.opName
      this.args.APIVERSION = config.K.SERVICES[this.SVC].api

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

  // docPk: propriéts de la pk - { p1:..., p2: ... }
  async sign (svc: string, org: string, docCl: string, docPk: Object) : Promise<boolean> {
    const sf = stores.safe
    for(const [id, c] of sf.mySafeCreds) {
      const pk = DocType.getPk(docCl, docPk)
      if (c.svc === svc && c.org === org
        && c.docCl === docCl && c.docPk === pk) {
        const x = await Crypt.sign(keyFromB64(c.privs), this.challenge)
        const sign = new Uint8Array(x)
        if (!this.signatures) this.signatures = {}
        this.signatures[docCl + '/' + pk] = [c.credId, sign]
        return true
      }
    }
    return false
  }

}
