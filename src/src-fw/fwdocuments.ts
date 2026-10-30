import d from './descriptors'
import { AppExc } from './base'
import { Registry, $Document } from './registry'

let n = 0, nf = 0, exc: AppExc | undefined

export class ADMIN$Status extends $Document {
  static _descriptor = d.ADMIN$Status

  static release = 0
  svc: string = ''
  st: number = 0 // code 0: inconnu 1: UP 2: READ-ONLY 9: DOWN
  at: number = 0 // time de dernière mise à jour
  txt: string = '' // texte explicatif éventuel de l'administrateur

  isUP () { return this.st === 1 || this.st === 2 }
  isRO () { return this.st === 2 }
  isRW () { return this.st === 1 }
  isDOWN () { return this.st === 9 }
}
if (!exc) { n++; exc = Registry.register(ADMIN$Status) }

export const FWreport = () : AppExc | undefined => {
  if (!exc)
    console.log(`FWloading: ${n} documents, ${nf} forms`)
  else {
    console.log(`FWloading FAILED: ${exc.toString()}`)
    return exc
  }
}
