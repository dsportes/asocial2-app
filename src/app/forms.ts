import { Registry } from '../src-fw/registry'
import { $Form } from '../src-fw/documents'

/*
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])

/* Méthodes surchargées par type *******************************
****************************************************************
  async initEtc (byU: boolean) : Promise<Object> {
    return {}
  }

  cloneEtc (etcX: Object | null) : Object | null {
    return etcX === null ? null : decode(encode(etcX))
  }

  eqEtc (etcX: Object | null, etcY: Object | null) : boolean {
    if (!etcX || !etcY) return false
    return equ8(encode(etcX), encode(etcY))
  }

  emptyEtc (etcX: Object | null) {
    return etcX === null || !Array.from(Object.keys(etcX)).length }

  async checkEtc (etcX: Object | null) : Promise<string> {
    return ''
  }

  async validate () : Promise<number> {
    return 0
  }
***************************************************************
****************************************************************/

class $Form_membrecodir extends $Form {
  constructor () { super() }
  
  initEtc (byU: boolean) : Object {
    return { pseudo: this.opts && this.opts.alias ? this.opts.alias : 'toto' }
  }
  cloneEtc (etcX: Object | null) : Object | null {
    return etcX === null ? null : { pseudo: etcX['pseudo'] }
  }
  eqEtc (etcX: Object | null, etcY: Object | null) : boolean {
    if (!etcX || !etcY) return false
    return etcX['pseudo'] !== etcY['pseudo']
  }
  async checkEtc (etcX: Object | null) : Promise<string> {
    if (etcX) {
      const l = etcX['pseudo'].length
      return l < 8 || l > 24 ? 'lgp' : ''
    } else return ''
  }
  async validate (args: any) : Promise<number> {
    return 0
  }
}
Registry.registerD($Form_membrecodir)

class $Form_membreredaction extends $Form {
  constructor () { super() }
}
Registry.registerD($Form_membreredaction)

class $Form_auteur extends $Form {
  constructor () { super() }
}
Registry.registerD($Form_auteur)


class $Form_coauteur extends $Form {
  constructor () { super() }
}
Registry.registerD($Form_coauteur)

export const regForms = () => {
  console.log('Forms registered')
}
