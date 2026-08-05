import { Registry, $Document } from './registry'
import { schemaExcFW } from '../src-fw/schema'

let n = 0
const ok = !schemaExcFW()

export class ADMIN$Status extends $Document {
  static release = 0
  svc: string
  st: number // code 0: inconnu 1: UP 2: READ-ONLY 9: DOWN
  at: number // time de dernière mise à jour
  txt: string // texte explicatif éventuel de l'administrateur

  isUP () { return this.st === 1 || this.st === 2 }
  isRO () { return this.st === 2 }
  isRW () { return this.st === 1 }
  isDOWN () { return this.st === 9 }
}
if (ok) { n++; Registry.register(ADMIN$Status) }

export const FWnbDocs = () : number => n
