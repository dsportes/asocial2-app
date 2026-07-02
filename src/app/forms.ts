import { Registry } from '../src-fw/registry'
import { $Form, $CredTempl } from '../src-fw/documents'

/*
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])
*/

class $Form_membrecodir extends $Form {
  constructor () { super() }

  initEtc (byU: boolean) : Object {
    return { pseudo: this.opts && this.opts.alias ? this.opts.alias : 'toto' }
  }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (etcX: Object | null) : Object | null {
    return { pseudo: !etcX ? '' : etcX['pseudo'] }
  }
  eqEtc (etcX: Object | null, etcY: Object | null) : boolean {
    const x = etcX || { pseudo: '' }
    const y = etcY || { pseudo: '' }
    return x['pseudo'] === y['pseudo']
  }
  async checkEtc (etcX: Object | null) : Promise<string> {
    if (etcX) {
      const l = etcX['pseudo'].length
      return l < 8 || l > 24 ? 'lgp' : ''
    } else return ''
  }

  async compileEtc (byU: boolean) : Promise<void> {
    if (!byU) return
    if (!this.opts) this.opts = {}
    // Template du credential d'accès à Codir/1
    this.opts.credTempl = $CredTempl.new(
      this.svc, this.org, 'CoDir', { pk: '1' }, this.opts.alias || '')
  }

  async validate (byU: boolean, etc: Object) : Promise<number> {
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
