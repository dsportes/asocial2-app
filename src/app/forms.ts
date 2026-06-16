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

cloneEtc (byU: boolean) : Object | null { 
  const etc = byU ? this.etcU : this.etcT
  return etc === null ? null : decode(encode(etc))
} 

chgEtc (byU: boolean, etc: Object) : boolean { 
  const etcB = byU ? this.etcU : this.etcT
  if (etc === null) return false
  return !equ8(encode(etc), encode(etcB))
} 

emptyEtc (etc: Object | null) { 
  return etc === null || !Array.from(Object.keys(etc)).length }

async checkEtc (byU: boolean, etc: Object) : Promise<number> { 
  return 0
}

async validate () : Promise<number> { 
  return 0
}
***************************************************************
****************************************************************/

class $Form_membrecodir extends $Form {
  constructor () { super() }
  async initEtc (byU: boolean) : Promise<Object> { 
    return { pseudo: '' }
  } 
  cloneEtc (byU: boolean) : Object | null { 
    const etc = byU ? this.etcU : this.etcT
    return etc === null ? null : { pseudo: etc['pseudo'] }
  }
  chgEtc (byU: boolean, etc: Object) : boolean { 
    const etcB = byU ? this.etcU : this.etcT
    if (etc === null) return false
    return etc['pseudo'] !== etcB['pseudo']
  } 
  async checkEtc (byU: boolean, etc: Object) : Promise<number> {
    const l = etc['pseudo'].length
    return l < 8 || l > 24 ? 1 : 0
  }
  async validate () : Promise<number> { 
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