// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { setCssVar } from 'quasar'
import { fromByteArray, toByteArray } from './base64'
import stores from '../stores/all'

// @ts-ignore
import { sha224, sha256 } from 'js-sha256'
import { gzip, ungzip } from './pako.mjs'

// const stores = null

export let $t: any
export let $q: any

export function setTQ (_$t, _$q) { $t = _$t; $q = _$q }

export function gzipT (data: Uint8Array) : Uint8Array { return gzip(data) }

export function ungzipT (data: Uint8Array) { return ungzip(data) }

export function setCss () {
  const d = $q.dark.isActive ? 0 : 1
  const t = stores.config.K.theme
  for(const c in t) setCssVar(c, t[c][d])
}

export class AppExc {
  /* 
  codes: serveur
  1000: erreurs fonctionnelles FW
  2000: erreurs fonctionnelles APP
  3000: assertions FW
  4000: assertions APP
  5000: assertions FW - transmises à l'administrateur
  6000: assertions APP - transmises à l'administrateur

  codes: poste
  10000: 'Interruption volontaire',

  11000: Toutes erreurs de réseau
  11001: 'Erreur inattendue du serveur. Status:{0} URL:{1}.\n{2}',
  11002: 'Erreur inattendue d\'envoi au serveur, de réseau, ou de réception de la réponse. URL:{0}.\n{1}',
  11003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  11005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  11006: 'Erreur de transfert du fichier vers l\'application locale de stockage de fichiers. Détail: {0}',


  12000: Toutes erreurs d'accès à la base locale
  12001: 'Ouverture de la base locale impossible.\nDétail: {0}',
  12002: 'Erreur d\'accès à la base locale impossible.\nDétail: {0}',

  13000:  Erreur inattendue trappée sur le browser
  13000: 'Bug probable de l\'application.\nDétail: {0}',
  13001: 'Retour de la requête mal formé : parse JSON en erreur. Opération: {0}\nDétail: {1}',
  13002: 'Retour de la requête mal formé : désérialisation en erreur. Opération: {0}\nDétail: {1}',
  13007: 'Echec d\'encryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  13008: 'Echec de decryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  13021: 'Bug probable de \'opération "{0}" après plusieurs tentatives aynat échoué.',
  13022: 'Fichier impossible à décrypter: {0}',
  13023: 'Echec de decryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  13024: 'Echec d\'encryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',

  14000: assertion trappée par le browser

  Codes "major"
  EX_1: 'Données saisies non conformes',
  EX_2: 'Données saisies non conformes',
  EX_3: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_4: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_5: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_6: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',

  EX_10: 'Interruption volontaire (appui sur le bouton rouge)',
  EX_11: 'Erreur d`accès au serveur, réseau indisponible ?',
  EX_12: 'Erreur d\'accès à la base locale',
  EX_13: 'Erreur inattendue survenue dans le traitement sur l\'appareil',
  EX_14: 'Erreur inattendue survenue dans le traitement sur l\'appareil',
  */

  public code: number
  public label: string
  public opName: string
  public org: string
  public stack: string
  public args: string[]
  public message: string

  constructor ( arg: any ) {
    this.label = arg.label || ''
    this.code = arg.code || 0
    this.opName = arg.opName || ''
    this.org = arg.org || ''
    this.args = arg.args || []
    this.stack = arg.stack || ''
    this.message = 'AppExc: ' + this.code + ':' + this.label +
      (this.opName ? '@' + this.opName + ':': '') + JSON.stringify(this.args || [])
  }
}

const encoder = new TextEncoder()

export function sty (sz?: string) {
  if (!sz) return $q.dark.isActive ? 'dark ' : 'clear '
  return ($q.dark.isActive ? 'dark bsfdark pw' : 'clear bsclear pw') + sz
}

export function sleep (delai: number) {
  if (delai <= 0) return
  return new Promise((resolve: Function) => { setTimeout(() => resolve(), delai) })
}

export interface fileDescr {
  size?: number
  name: string
  type?: string
  b64?: string
  u8?: Uint8Array
}

export async function readFile (file: any, bin: boolean) : Promise<fileDescr> {
  return new Promise((resolve, reject) => {
    const fd: fileDescr = { size: file.size, name: file.name }
    if (!file.type) {
      fd.type = file.name.endsWith('.md') || file.name.endsWith('.markdown') ? 'text/markdown' : 'application/octet-stream'
    } else fd.type = file.type

    const reader = new FileReader()
    reader.addEventListener('load', (event: any) => {
      if (!bin) {
        fd.b64 = event.target.result
      } else {
        fd.u8 = new Uint8Array(event.target.result)
      }
      resolve(fd)
    })
    reader.onerror = (error) => reject(error)
    if (!bin) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

export function openHelp (page: string) {
  const ph = stores.config.getHelpPages()
  if (!ph.has(page)) {
    $q.dialog({
      // title: 'Alert',
      message: $t('HLPaidebd', [page]),
      ok: { label: $t('gotit'), flat:true, color: "primary" }
    }).onOk(() => { }).onCancel(() => { }).onDismiss(() => { })
  }
  else {
    // TODO
    console.log('Ouverture page aide ', page)
    return
  }
}

export function urlFromText (text: string, type?: string) : string {
  const blob = new Blob([encoder.encode(text)], { type: type || 'text/html' })
  return URL.createObjectURL(blob)
}

export function reloadPage () {
  const hr = window.location.href
  const t =  `<html><head><meta charset="utf-8">
<script>
setTimeout(() => { window.location.href = "${hr}" }, 2000)
</script>
<style>div {font-size:18px;margin:12px;font-family:sans-serif;text-align:center;};</style>
</head><body>
<div>Application reloading, please wait 2s.</div>
<div>Rechargement de l'application, merci d'attendre 2s.</div>
</body></html>`
  window.location.href = urlFromText(t)
}

export function coolBye () {
  window.location.href = urlFromText(stores.config.K.coolbyeHtml(window.location.href))
}

export function objToB64 (obj: any, url?: boolean) : string {
  if (!obj) return ''
  const u8 = new Uint8Array(encode(obj))
  return u8ToB64(u8, url)
}

export function u8ToB64 (u8: Uint8Array, url?: boolean) : string {
  if (!u8) return ''
  const s = fromByteArray(u8)
  return !url ? s : s.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function b64ToU8 (b64: string) : Uint8Array {
  if (!b64) return null
  const diff = b64.length % 4
  let x = b64
  if (diff) {
    const pad = '===='.substring(0, 4 - diff)
    x = b64 + pad
  }
  return new Uint8Array(toByteArray(x.replace(/-/g, '+').replace(/_/g, '/')))
}

export function b64ToObj (b64: string) : any {
  const bin = b64ToU8(b64)
  return decode(bin)
}

export function clone (obj: any) : any {
  return b64ToObj(objToB64(obj))
}

export function concat (views: ArrayBufferView[]) {
  let length = 0
  for (const v of views) length += v.byteLength
  const buf = new Uint8Array(length)
  let offset = 0
  for (const v of views) {
      const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
      buf.set(uint8view, offset)
      offset += uint8view.byteLength
  }
  return buf
}
