import { Registry } from '../src-fw/registry'
import { $Form, $CredTempl } from '../src-fw/documents'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

/*
new FormType('membrecodir', 'k1', ['A'])
new FormType('membreredaction', 'k1', ['A'])
new FormType('auteur', 'k2', ['Redaction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType('coauteur', 'k2', ['Redaction/1', 'Auteur/$1'])
*/

class $Form_membrecomite extends $Form {
  docCl: string
  constructor (docCl: string) { super(); this.docCl = docCl }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (byU: boolean) : Object {
    if (byU) return { pseudo: this.etcU ? this.etcU['pseudo'] : '' }
    const alias = this.opts ? this.opts.alias || '?' : '?'
    return { pseudo: this.etcT ? this.etcT['pseudo'] : alias }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    if (!x || !y) return false
    return x['pseudo'] === y['pseudo']
  }
  async checkEtc (etc: Object) : Promise<string> {
    const p = etc['pseudo'] || ''
    return p.length < 8 || p.length > 24 ? 'lgp' : ''
  }

  async compileEtc (etc: Object, byU: boolean) : Promise<void> {
    if (!byU) return
    const comment = $t('CREDON_' + this.docCl)
    const name = etc['pseudo']
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

  cloneEtc (byU: boolean) : Object | null {
    const etc = byU ? this.etcU : this.etcT
    return { 
      nomAuteur: !etc ? '' : etc['nomAuteur'],
      section: !etc ? '' : etc['section']
    }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    if (!x || !y) return false
    return (x['nomAuteur'] === y['nomAuteur']) && (x['section'] === y['section'])
  }
  async checkEtc (etc: Object | null) : Promise<string> {
    const a = etc['nomAuteur'] || ''
    const s = etc['section'] || ''
    if (a.length < 6 || a.length > 24) return 'nomAuteur'
    return s.length < 2 ? 'section' : ''
  }

  async compileEtc (etc: Object, byU: boolean) : Promise<void> { // en chantier
    if (!byU) return
    const nomAuteur = etc['nomAuteur']
    const autid = Crypt.rnd(15)
    const ct = await $CredTempl.new(this.userId, this.svc, this.org, 'Auteur', 
      { autid: autid }, nomAuteur, { name: nomAuteur })
    this.opts.auteur = { autid, nomAuteur, section: etc['section'] },
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
