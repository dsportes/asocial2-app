/* Retourne un string en base 64 depuis un binaire */
export function keyToB64 (key: Uint8Array | null) : string {
  if (!key) return ''
  // @ts-expect-error
  return window.btoa(String.fromCharCode.apply(null, key))
}

/* Retourne un binaire depuis un string en base 64 */
export function keyFromB64 (key: string) : Uint8Array {
  if (!key) new Uint8Array([])
  const s = window.atob(key)
  const u8 = new Uint8Array(s.length)
  for (let i = 0, strLen = key.length; i < strLen; i++) u8[i] = s.charCodeAt(i)
  return u8
}

const p2 = [1, 0, 0, 0, 0, 0]; for (let i = 1; i < 6; i++) p2[i] = p2[i - 1] * 256

export function b64ToInt (b64) { // b64 sur 8 char -> number integer safe
  const u8 = keyFromB64(b64)
  let r = 0
  for (let j = 0; j < 6; j++) r += (p2[j] * u8[j])
  return r
}

export function intToB64 (n) { // n: number integer safe -> 8 char
  const u8 = new Uint8Array(6)
  let x = n
  for (let j = 0; j < 6; j++) {
    u8[j] = x % 256
    x = Math.floor(x / 256)
  }
  return keyToB64(u8)
}

/* Retourne un string en base 64 URL depuis un base 64 standard */
export function toUrl (s: string) : string {
  if (!s) return ''
  let i = s.length
  for(; s.charAt(i-1) === '='; i--) {}
  return s.substring(0, i).replace(/\+/g, '-').replace(/\//g, '_')
}

/* Retourne un string en base 64 stanadard depuis un string en base 64 URL */
export function fromUrl (s: string) : string {
  const diff = s.length % 4
  const pad = diff ? '===='.substring(0, 4 - diff) : ''
  return s.replace(/-/g, '+').replace(/_/g, '/') + pad
}
