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
