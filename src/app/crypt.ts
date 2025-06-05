import { u8ToB64, concat } from './util'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
import { sha256 } from 'js-sha256'
import { fromByteArray } from './base64'

const padding = 'abcdefghijklmnopqrstuvwzyzABCDEF'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const p2 = [1, 0, 0, 0, 0, 0]; for (let i = 1; i < 6; i++) p2[i] = p2[i - 1] * 256

function u8ToHex (u8) {
  // @ts-ignore
  return Array.from(u8).map((i) => i.toString(16).padStart(2, '0')).join(' ')
}

export class Crypt {

  static alg = { name: 'ECDH', namedCurve: 'P-521' }

  static async crypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await crypto.subtle.importKey('raw', cle, 'AES-GCM', false, ['encrypt'])
      const enc = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 }, key, buf))
      const x = concat([iv, enc])
      // const authTag = buf.subarray(buf.byteLength - 16)
      // console.log('crypterSrv authTag ', u8ToHex(authTag))
      return x
    } catch (e) {
      return null
    }
  }

  static async decrypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const key = await crypto.subtle.importKey('raw', cle, 'AES-GCM', false, ['decrypt'])
      const iv = buf.subarray(0, 12)
      const enc = buf.subarray(12)
      // const authTag = buf.subarray(buf.byteLength - 16)
      // console.log('decrypterSrv authTag ', u8ToHex(authTag))
      return new Uint8Array(await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 }, key, enc))
    } catch (e) {
      return null
    }
  }

  static async getKeyPair () : Promise<Uint8Array[]> {
    const p = await crypto.subtle.generateKey(Crypt.alg, true, ['deriveKey'])
    return [
      new Uint8Array(await crypto.subtle.exportKey('raw', p.publicKey)),
      new Uint8Array(encode(await crypto.subtle.exportKey('jwk', p.privateKey)))
    ]
  }

  static async getAESKey (pubKey: Uint8Array, myPrivKey: Uint8Array): Promise<Uint8Array> {
    const pub = await crypto.subtle.importKey('raw', pubKey, Crypt.alg, true, [])
    const priv = await crypto.subtle.importKey('jwk', decode(myPrivKey), Crypt.alg, true, ['deriveKey'])
    const k = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    )
    return new Uint8Array(await crypto.subtle.exportKey('raw', k))
  }

  static async strongHash (s1: string, s2: string) : Promise<string> {
    const x = s1.length >= padding.length ? s1 : s1 + padding.substring(0, padding.length - s1.length)
    const y = s2.length >= padding.length ? s2 : s2 + padding.substring(0, padding.length - s2.length)
    const h1 = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(x)))
    const salt = h1.subarray(0, 16)
    const p = await crypto.subtle.importKey('raw', encoder.encode(x + '@@@' + y), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt : salt, iterations: 20000, hash: 'SHA-256' },
      p,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const res = new Uint8Array(await crypto.subtle.exportKey('raw', key))
    return u8ToB64(res, true)
  }

  /*
  static async aSha32 (x: any) { // 9 fois plus long que js-sha256 
    const u8 = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(x)))
    const s = fromByteArray(u8)
    return s.substring(0, s.length - 1).replace(/\+/g, '-').replace(/\//g, '_')
  }
  */

  static sha32 (x: any) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    const s = fromByteArray(u8)
    return s.substring(0, s.length - 1).replace(/\+/g, '-').replace(/\//g, '_')
  }

  static sha12 (x: any) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    const s = fromByteArray(u8.subarray(3, 15))
    return s.replace(/\+/g, '-').replace(/\//g, '_')
  }

  static shaInt (x: any) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    let r = 0
    for (let i = 3, j = 0; j < 6; i++, j++) r += (p2[j] * u8[i])
    return r
  }
}

export async function testSH () {
  const x = 'toto est tres tres beau'
  // console.log(Crypt.sha32(x))
  // console.log(Crypt.sha12(x))
  // console.log(Crypt.shaInt(x))
  /*
  const t = Date.now()
  for (let i= 0; i< 100000; i++) await Crypt.sha32(x)
  const n = Date.now() - t
  console.log('sha32 : ', n)
  */
  // console.log(await Crypt.strongHash('pierre', 'legrand'))
}

export async function testECDH () {
  // Dans app
  const appPair = await Crypt.getKeyPair()
  const appPub = appPair[0]
  console.log(u8ToB64(appPub), u8ToB64(appPair[1]))

  // Dans srv
  const srvPair = await Crypt.getKeyPair()
  const srvPub = srvPair[0]
  console.log(u8ToB64(srvPub), u8ToB64(srvPair[1]))

  const aesSrv = await Crypt.getAESKey(appPub, srvPair[1])
  console.log('aesSrv: ', u8ToB64(aesSrv))
  const x1 = await Crypt.crypterSrv(aesSrv, new TextEncoder().encode('toto est tres beau'))

  // Dans app
  const aesApp = await Crypt.getAESKey(srvPub, appPair[1])
  console.log('aesApp: ', u8ToB64(aesApp))
  const x3 = await Crypt.decrypterSrv(aesApp, x1)
  const x2 = decoder.decode(x3)
  console.log(x2)
}
