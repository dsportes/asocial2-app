// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { keyToB64, keyFromB64, toUrl, fromUrl } from '../src-fw/b64'
import stores from '../stores/all'

// @ts-ignore
import { gzip, ungzip } from './pako.mjs'

// const stores = null

export let $t: any
export let i18n: any
export function set$t (_$t, _i18n) { $t = _$t; i18n = _i18n }

export function gzipT (data: Uint8Array) : Uint8Array | undefined { return gzip(data) }

export function ungzipT (data: Uint8Array) { return ungzip(data) }

export function hasMessage (code: string) : boolean {
  const k = stores.config.K
  for (const opt of k.localeOptions) {
    const mx = i18n.messages.value[opt.value]
    if (mx && mx[code]) return true
  }
  return false
}

let audioContext: AudioContext | null = null
export async function beep (son: string) {
  if (!audioContext) audioContext = new AudioContext()
  const b64 = son.substring(son.indexOf(',') + 1)
  const buf = keyFromB64(b64).buffer as ArrayBuffer
  const b = await audioContext.decodeAudioData(buf) // (arrayBuffer)
  const source = audioContext.createBufferSource() // creates a sound source
  source.buffer = b // tell the source which sound to play
  source.connect(audioContext.destination) // connect the source to the context's destination (the speakers)
  source.start() // play the source now
}

export function edvol (vol: number) : string {
  const v = vol || 0
  if (v === 0) return '0B'
  if (v < 1000) return v + 'B'
  if (v < 1000000) return (v / 1000).toPrecision(3) + 'KB'
  if (v < 1000000000) return (v / 1000000).toPrecision(3) + 'MB'
  if (v < 1000000000000) return (v / 1000000000).toPrecision(3) + 'GB'
  if (v < 1000000000000000) return (v / 1000000000000).toPrecision(3) + 'TB'
  return (v / 1000000000000000).toPrecision(3) + 'PB'
}

export function quarter (d: Date) {
  const y = d.getUTCFullYear() % 2000
  const q = Math.floor(d.getUTCMonth() / 4)
  return (y * 4) + q
}

type Date3 = [number, number, number] // full year, mont, date
let auj: Date3 = [0, 0, 0], hier: Date3 = [0, 0, 0]

function zp (n: number) { return n > 9 ? '' + n: '0' + n }

export function aujhier () {
  const now = new Date()
  const n = [now.getFullYear(), now.getMonth(), now.getDate()] as Date3
  if (n[0] === auj[0] && n[1] === auj[1] && n[2] === auj[2]) return
  auj = n
  const h = new Date(now.getTime() - 86400000)
  hier = [h.getFullYear(), h.getMonth(), h.getDate()]
}

export function dhcool (timems, sec, pash) {
  if (!timems) return $t('DHCnondate')
  aujhier()
  const dx = new Date(timems)
  const d = [dx.getFullYear(), dx.getMonth(), dx.getDate()]
  const mm = auj[0] === d[0] && auj[1] === d[1]
  if (mm && auj[2] === d[2]) {
    return pash ? $t('DHCauja') : $t('DHCaujah', [hms(dx, sec)])
  }
  if (hier[0] === d[0] && hier[1] === d[1] && hier[2] === d[2]) {
    return pash ? $t('DHChiera') : $t('DHChierah', [hms(dx, sec)])
  }
  if (mm) {
    return pash ? $t('DHClea', [d[2]]) : $t('DHCleah', [d[2], hms(dx, sec)])
  }
  return pash ? $t('DHCja', [aaaammjj(dx)]) : $t('DHCjah', [aaaammjj(dx), hms(dx, sec)])
}

// Retourne hh-mm-ss d'une date
export function hms (t: Date | number, sec?: boolean) : string {
  if (!t) return '?'
  const d = t instanceof Date ? t : new Date(t)
  const hh = zp(d.getHours())
  const mm = ':' + zp(d.getMinutes())
  const ss = sec ? ':' + zp(d.getSeconds()) : ''
  return hh + mm + ss
}

// Retourne aaaa-mm-jj d'une date
export function aaaammjj (t: Date | number) : string {
  if (!t) return '?'
  const d = t instanceof Date ? t : new Date(t)
  const aa = d.getFullYear()
  const mm = '-' + zp(d.getMonth() + 1)
  const jj = '-' + zp(d.getDate())
  return aa + mm + jj
}

export function dhstring (t: Date | number) {
  const d = t instanceof Date ? t : new Date(t)
  return d.toISOString()
  // return aaaammjj(d) + ' ' + hms(d, sec)
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

  constructor (code: number, label: string, opName?: string, args?: string[], stack?: string) {
    this.code = code || 0
    this.label = label || ''
    this.opName = opName || ''
    this.args = args || []
    this.stack = stack || ''
    this.org = ''
  }

  get message () { return 'AppExc: ' + this.code + ':' + this.label +
    (this.opName ? '@' + this.opName + ':' : '') +
    JSON.stringify(this.args || []) }

  toString () { return this.message + (this.stack ? '\n' + this.stack : '')}

  static fromObj (obj: any) {
    const exc = new AppExc(obj.code, obj.label, obj.opName, obj.args, obj.stack)
    if (obj.org) exc.org = obj.org
    return exc
  }
}

const encoder = new TextEncoder()

export function dkli (idx) {
  const d = stores.ui.isDark
  return (d ? (idx ? 'dark' + (idx % 2) : 'dark0') : (idx ? 'clear' + (idx % 2) : 'clear0')) + ' '
}

export function sty (sz?: string) {
  const d = stores.ui.isDark
  if (!sz) return d ? 'dark ' : 'clear '
  return (d ? 'dark bsfdark pw' : 'clear bsclear pw') + sz
}

/*
export function styp (sz?: string) {
  const d = stores.ui.isDark
  // if (!$q) $q = useQuasar()
  return (d ? 'sombre bsf pw' : 'clair bsc pw') + (sz || 'md') + ' '
}
*/

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

export function cloneSet (s: any) : any {
  const s2 = new Set()
  for (const x of s) s2.add(x)
  return s2
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

export const eqNumberA = (a: any[], b: any[]) : boolean => {
  if (!a && !b) return true
  if (!a && b) return false
  if (a && !b) return false
  if (a.length !== b.length) return false
  return isSameSet(new Set(a), new Set(b))
}

export const isSameSet = (s1, s2) => {
  if (s1.size !== s2.size) return false
  return [...s1].every(i => s2.has(i))
}

export const equ8 = (a: Uint8Array, b: Uint8Array) : boolean => {
  if (!a && !b) return true
  if (!a && b) return false
  if (a && !b) return false
  if (a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
