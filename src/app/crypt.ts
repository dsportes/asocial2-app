export class Crypt {

  static buildSalt () {
    const s = new Uint8Array(16)
    for (let j = 0; j < 16; j++) s[j] = j + 47
    return s
  }

  static salt = Crypt.buildSalt()

  static async crypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      // const x0 = new Uint8Array(1).fill(n)
      const key = await window.crypto.subtle.importKey('raw', cle, 'AES-GCM', false, ['encrypt'])
      return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: Crypt.salt }, key, buf))
    } catch (e) {
      return null
    }
  }

  static async decrypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const key = await window.crypto.subtle.importKey('raw', cle, 'AES-GCM', false, ['decrypt'])
      return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Crypt.salt }, key, buf))
    } catch (e) {
      return null
    }
  }
}


export class ECDH {
  static format = 'raw'
  static alg = { name: 'ECDH', namedCurve: 'P-521' }

  pair: any
  pub: Uint8Array

  constructor () {
  }

  async initKeyPair () {
    this.pair = await crypto.subtle.generateKey(ECDH.alg, true, ['deriveKey'])
    this.pub = new Uint8Array(await crypto.subtle.exportKey('raw', this.pair.publicKey))
    return this
  }

  async getAESKey (importedPubKey: Uint8Array): Promise<Uint8Array> {
    const imp = await crypto.subtle.importKey('raw', importedPubKey, ECDH.alg, true, [])
    const k = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: imp },
      this.pair.privateKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    return new Uint8Array(await crypto.subtle.exportKey('raw', k))
  }
}

export async function testECDH () {
    // Dans app
    const appPair = await new ECDH().initKeyPair()
    const appPub = appPair.pub
    console.log(appPub)

    // Dans srv
    const srvPair = await new ECDH().initKeyPair()
    const srvPub = await srvPair.pub
    console.log(srvPub)

    const aesSrv = await srvPair.getAESKey(appPub)
    const x1 = await Crypt.crypterSrv(aesSrv, new TextEncoder().encode('toto est tres beau'))

    // Dans app
    const aesApp = await appPair.getAESKey(srvPub)
    const x2 = new TextDecoder().decode(await Crypt.decrypterSrv(aesApp, x1))
    console.log(x2)

  }
