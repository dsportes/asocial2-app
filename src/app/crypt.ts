export class Crypt {

  static buildSalt () {
    const s = new Uint8Array(16)
    for (let j = 0; j < 16; j++) s[j] = j + 47
    return Buffer.from(s)
  }

  static salt = Crypt.buildSalt()

  static async crypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      // const x0 = new Uint8Array(1).fill(n)
      const key = await window.crypto.subtle.importKey('raw', cle, 'aes-cbc', false, ['encrypt'])
      return new Uint8Array(await crypto.subtle.encrypt({ name: 'aes-cbc', iv: Crypt.salt }, key, buf))
    } catch (e) {
      return null
    }
  }

  static async decrypterSrv (cle: Uint8Array, buf: Uint8Array) : Promise<Uint8Array> {
    try {
      const key = await window.crypto.subtle.importKey('raw', cle, 'aes-cbc', false, ['decrypt'])
      return new Uint8Array(await crypto.subtle.decrypt({ name: 'aes-cbc', iv: Crypt.salt }, key, buf))
    } catch (e) {
      return null
    }
  }
}
