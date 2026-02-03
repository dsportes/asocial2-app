import { u8ToB64, concat } from './util'
// @ts-ignore
import { encode, decode } from '@msgpack/msgpack'
// @ts-ignore
import { sha256 } from 'js-sha256'
import { fromByteArray } from './base64'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export type KeyPair = {
  pub: ArrayBuffer,
  priv: ArrayBuffer
}

const p2 = [1, 0, 0, 0, 0, 0]; for (let i = 1; i < 6; i++) p2[i] = p2[i - 1] * 256

function u8ToHex (u8) {
  // @ts-ignore
  return Array.from(u8).map((i) => i.toString(16).padStart(2, '0')).join(' ')
}

function ab2str(buf: ArrayBuffer) : string {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str: string) : ArrayBuffer{
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) bufView[i] = str.charCodeAt(i)
  return buf
}
/*
Export the given key and write it into the "exported-key" space.
*/
export function toPem(key: ArrayBuffer, pub?: boolean) : string {
  const exportedAsString = ab2str(key)
  const exportedAsBase64 = window.btoa(exportedAsString)
  return !pub ? `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`
  : `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`
}

export function fromPem(pem: string, pub?: boolean) : ArrayBuffer {
  // fetch the part of the PEM string between header and footer
  const pemHeader = pub ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----'
  const pemFooter = pub ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----'
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length - 1)
  // base64 decode the string to get the binary data
  const binaryDerString = window.atob(pemContents)
  // convert from a binary string to an ArrayBuffer
  return str2ab(binaryDerString)
}

export class Crypt {
  static algs = {
    ecdh: { name: 'ECDH', namedCurve: 'P-521' },
    ecdsa: { name: 'ECDSA', namedCurve: 'P-521' },
    ecdsasv: { name: 'ECDSA', hash: 'SHA-256' },
    rsa: { name: 'RSASSA-PKCS1-v1_5', // 'RSA-OAEP' PAS pour sign / verify
      modulusLength: 2048, 
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), 
      hash: {name: "SHA-256"} },
    rsasv: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
  }
  static alg = 'rsa'

  static async crypt (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await crypto.subtle.importKey('raw', cle as BufferSource, 'AES-GCM', false, ['encrypt'])
      const enc = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 }, key, buf as BufferSource))
      const x = concat([iv, enc])
      // const authTag = buf.subarray(buf.byteLength - 16)
      // console.log('crypt authTag ', u8ToHex(authTag))
      return x
    } catch (e) {
      return null
    }
  }

  static async decrypt (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const key = await crypto.subtle.importKey('raw', cle as BufferSource, 'AES-GCM', false, ['decrypt'])
      const iv = buf.subarray(0, 12) as BufferSource
      const enc = buf.subarray(12) as BufferSource
      // const authTag = buf.subarray(buf.byteLength - 16)
      // console.log('decrypt authTag ', u8ToHex(authTag))
      return new Uint8Array(await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 }, key, enc))
    } catch (e) {
      return null
    }
  }

  static async getKeyPair () : Promise<KeyPair> {
    const p = await crypto.subtle.generateKey(Crypt.algs.ecdh, true, ['deriveKey'])
    const spki = await crypto.subtle.exportKey('spki', p.publicKey)
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', p.privateKey)
    return { pub: spki, priv: pkcs8 }
  }
    
  static async getSVKeyPair () : Promise<KeyPair> {
    const p = await crypto.subtle.generateKey(Crypt.algs[Crypt.alg], true, ['sign', 'verify'])
    const spki = await crypto.subtle.exportKey('spki', p.publicKey)
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', p.privateKey)
    return { pub: spki, priv: pkcs8 }
  }

  static async getAESKey (pubKey: ArrayBuffer, myPrivKey: ArrayBuffer): Promise<Uint8Array> {
    const pub = await crypto.subtle.importKey('spki', pubKey, Crypt.algs.ecdh, true, [])
    const priv = await crypto.subtle.importKey('pkcs8', myPrivKey, Crypt.algs.ecdh, true, ['deriveKey'])
    const k = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    )
    return new Uint8Array(await crypto.subtle.exportKey('raw', k))
  }

  static async sign (privKey: ArrayBuffer, data: Uint8Array) : Promise<Uint8Array> {
    const priv = await crypto.subtle.importKey('pkcs8', privKey, Crypt.algs[Crypt.alg], false, ['sign'])
    return new Uint8Array(await crypto.subtle.sign(Crypt.algs[Crypt.alg + 'sv'], priv, data as BufferSource))
  }

  static async verify (pubKey: ArrayBuffer, signature: Uint8Array, data: Uint8Array) : Promise<boolean> {
    const pub = await crypto.subtle.importKey('spki', pubKey, Crypt.algs[Crypt.alg], true, ['verify'])
    return await crypto.subtle.verify(Crypt.algs[Crypt.alg + 'sv'], pub, signature as BufferSource, data as BufferSource)
  }

  static async strongHash (s: string | Uint8Array, pad?: boolean, bin?: boolean) 
  : Promise<string | Uint8Array> {
    let x: Uint8Array = typeof s === 'string' ? encoder.encode(s) : s as Uint8Array
    const l = 32 - x.length
    let ex: Uint8Array
    if (!pad || l <= 0) ex = x
    else {
      const p = new Uint8Array(l)
      p.fill(35, 0, l) // 35 : ASCII de #
      ex = concat([x, p])
    }
    const h1 = new Uint8Array(sha256.arrayBuffer(ex))
    // const h1 = new Uint8Array(await crypto.subtle.digest("SHA-256", ex as BufferSource))
    const salt = h1.subarray(0, 16)
    const p = await crypto.subtle.importKey('raw', ex as BufferSource, 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt : salt, iterations: 20000, hash: 'SHA-256' },
      p,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const res = new Uint8Array(await crypto.subtle.exportKey('raw', key))
    return bin ? res : u8ToB64(res, true)
  }

  /*
  static async sha (x: any) { // 9 fois plus long que js-sha256
    const u8 = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(x)))
    const s = fromByteArray(u8)
    return s.substring(0, s.length - 1).replace(/\+/g, '-').replace(/\//g, '_')
  }
  */

  /* sha256
  // arg string : It also supports byte `Array`, `Uint8Array`, `ArrayBuffer` input
  */
  static sha (x: any, bin? :boolean) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    if (bin) return u8
    const s = fromByteArray(u8)
    return s.substring(0, s.length - 1).replace(/\+/g, '-').replace(/\//g, '_')
  }

  static shaS (x: any) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    const s = fromByteArray(u8.subarray(3, 18))
    return s.replace(/\+/g, '-').replace(/\//g, '_')
  }

  static shaInt (x: any) {
    const u8 = new Uint8Array(sha256.arrayBuffer(x))
    let r = 0
    for (let i = 3, j = 0; j < 6; i++, j++) r += (p2[j] * u8[i])
    return r
  }

  static random (nbytes: number) {
    const u8 = new Uint8Array(nbytes)
    window.crypto.getRandomValues(u8)
    return u8
  }

  static rnd (nbytes: number) {
    const s = fromByteArray(Crypt.random(nbytes))
    return s.replace(/=/g, '').replace(/\+/g, '0').replace(/\//g, '1')
  }
}

export async function testSH () {
  const x = 'toto est tres tres beau'
  console.log(Crypt.sha(x))
  console.log(Crypt.shaS(x))
  console.log(Crypt.shaInt(x))

  console.log(await Crypt.strongHash(x))
  console.log(await Crypt.strongHash(encoder.encode(x)))
  console.log(await Crypt.strongHash(x, true))
  console.log(await Crypt.strongHash(encoder.encode(x), true))
  console.log(Crypt.sha(x))
  console.log(Crypt.sha(encoder.encode(x)))
  console.log(Crypt.shaS(x))
  console.log(Crypt.shaInt(x))

  /*
  const t = Date.now()
  for (let i= 0; i< 100000; i++) await Crypt.sha(x)
  const n = Date.now() - t
  console.log('sha : ', n)
  */
}

export async function testECDH () {
  const x = new TextEncoder().encode('toto est tres tres beau')
  const xx = new TextEncoder().encode('toto est tres tres beaux')

  // Dans app
  const appPair = await Crypt.getKeyPair()
  const appPub = toPem(appPair.pub, true)
  const appPriv = toPem(appPair.priv)
  console.log('ECDH: APP crypt/decrypt')
  console.log(appPub)
  console.log(appPriv)

  const appSVPair = await Crypt.getSVKeyPair()
  const appSVPub = toPem(appSVPair.pub, true)
  const appSVPriv = toPem(appSVPair.priv)
  console.log('RSA: SRV sign/verify')
  console.log(appSVPub)
  console.log(appSVPriv)
  const sign = await Crypt.sign(appSVPair.priv, x)

  // Dans srv
  const verif1 = await Crypt.verify(fromPem(appSVPub, true), sign, x)
  console.log('verif1 = ', verif1)
  const verif2 = await Crypt.verify(fromPem(appSVPub, true), sign, xx)
  console.log('verif2 = ', verif2)

  const srvPair = await Crypt.getKeyPair()
  const srvPub = toPem(srvPair.pub, true)
  const srvPriv = toPem(srvPair.priv)
  console.log('ECDH: SRV crypt/decrypt')
  console.log(srvPub)
  console.log(srvPriv)

  const aesSrv = await Crypt.getAESKey(fromPem(appPub, true), srvPair.priv)
  console.log('aesSrv: ', u8ToB64(aesSrv))
  const x1 = await Crypt.crypt(aesSrv, x)

  // Dans app
  const aesApp = await Crypt.getAESKey(fromPem(srvPub, true), appPair.priv)
  console.log('aesApp: ', u8ToB64(aesApp))
  const x3 = await Crypt.decrypt(aesApp, x1)
  const x2 = decoder.decode(x3)
  console.log(x2)
}
