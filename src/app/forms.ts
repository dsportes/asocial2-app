import { Registry } from '../src-fw/registry'
import { $Form, $CredTempl } from '../src-fw/documents'
import { $t } from '../src-fw/util'

/*
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Readction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Readction/1', 'Auteur/$1'])
*/

class $Form_membrecomite extends $Form {
  docCl: string
  constructor (docCl: string) { super(); this.docCl = docCl }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (byU: boolean) : Object | null {
    if (byU) return { pseudo: this.etcU ? this.etcU['pseudo'] : '' }
    const alias = this.opts ? this.opts.alias || '?' : '?'
    return { pseudo: this.etcT ? this.etcT['pseudo'] : alias }
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
    this.opts.credTemplates = {}
    const comment = $t('CREDON_' + this.docCl)
    const name = this.etcU ? this.etcU['pseudo'] : this.etcT['pseudo']
    const ct = await $CredTempl.new(this.userId, this.svc, this.org, this.docCl, 
      { pk: '1' }, comment, { name })
    this.opts.credTemplates[ct.credId] = ct
  }

}
Registry.registerD($Form_membrecomite)

class $Form_membrecodir extends $Form_membrecomite {
  constructor () { super('CoDir') }
}
Registry.registerD($Form_membrecodir)

class $Form_membreredaction extends $Form_membrecomite {
  constructor () { super('Redaction') }
}
Registry.registerD($Form_membreredaction)

class $Form_auteur extends $Form {
  constructor () { super() }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (byU: boolean) : Object | null {
    const etcX = byU ? this.etcU : this.etcT
    return { 
      nomAuteur: !etcX ? '' : etcX['nomAuteur'],
      section: !etcX ? '' : etcX['section']
     }
  }
  eqEtc (etcX: Object | null, etcY: Object | null) : boolean {
    const x = etcX || { nomAuteur: '', section: '' }
    const y = etcY || { nomAuteur: '', section: '' }
    return (x['nomAuteur'] === y['nomAuteur']) && (x['section'] === y['section'])
  }
  async checkEtc (etcX: Object | null) : Promise<string> {
    if (etcX) {
      const l = etcX['nomAuteur'].length
      return l < 6 || l > 24 ? 'lgp' : ''
    } else return ''
  }

  async compileEtc (byU: boolean) : Promise<void> { // en chantier
    if (!byU) return
    if (!this.opts) this.opts = {}
    // Template du credential d'accès à Codir/1
    this.opts.credTemplates = {}
    const comment = $t('CREDON_Auteur')
    const nomAuteur = this.etcU ? this.etcU['nomAuteur'] : this.etcT['nomAuteur']
    const ct = await $CredTempl.new(this.userId, this.svc, this.org, 'Auteur', 
      { pk: '1' }, comment, { nomAuteur })
    this.opts.credTemplates[ct.credId] = ct
  }

}
Registry.registerD($Form_auteur)


class $Form_coauteur extends $Form {
  constructor () { super() }
}
Registry.registerD($Form_coauteur)

export const regForms = () => {
  console.log('Forms registered')
}
