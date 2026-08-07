import { schemaExcAS2 } from '../as2/schema'

import { Registry } from '../src-fw/registry'
import { $Form, $CredTempl } from '../src-fw/documents'
import { DocDescriptor } from '../src-fw/docDescriptor'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import { AS2$Auteur } from './documents'

const ok = !schemaExcAS2()
let n = 0

/*
new FormType(svc, 'membrecodir', 'k1', ['A'])
new FormType(svc, 'membreredaction', 'k1', ['A'])
new FormType(svc, 'auteur', 'k2', ['Redaction/1'])
// Un Auteur peut aussi nommer un co-auteur
new FormType(svc, 'coauteur', 'k2', ['Redaction/1', 'Auteur/$1'])
*/

class AS2$Form extends $Form {
  constructor () { super() }
}
if (ok) { n++; Registry.register(AS2$Form) }

class AS2$Form_membrecomite extends AS2$Form {
  docCl: string

  emptyEtc = { pseudo: '' }

  constructor (docCl: string) { 
    super(); this.docCl = docCl }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (byU: boolean) : Object {
    if (byU) return { pseudo: this.etcU ? this.etcU['pseudo'] : '' }
    const alias = this.opts ? this.opts.alias || '' : ''
    return { pseudo: this.etcT ? this.etcT['pseudo'] : alias }
  }
  eqEtc (x: any, y: any) : boolean {
    const x1 = x || this.emptyEtc
    const y1 = y || this.emptyEtc
    return x1.pseudo === y1.pseudo
  }
  async checkEtc (etc: Object) : Promise<string> {
    const p = etc['pseudo'] || ''
    return p.length < 4 || p.length > 24 ? $t('FORM_AS2_diag_lgp') : ''
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

class AS2$Form_membrecodir extends AS2$Form_membrecomite {
  constructor () { super('CoDir') }
}
if (ok) { n++; Registry.register(AS2$Form_membrecodir) }

class AS2$Form_membreredaction extends AS2$Form_membrecomite {
  constructor () { super('Redaction') }
}
if (ok) { n++; Registry.register(AS2$Form_membreredaction) }

class AS2$Form_auteur extends $Form {
  emptyEtc = { nomAuteur: '', section: '' }

  constructor () { super() }

  cloneEtc (byU: boolean) : Object | null {
    const etc = byU ? this.etcU : this.etcT
    return { 
      nomAuteur: !etc ? '' : etc['nomAuteur'],
      section: !etc ? '' : etc['section']
    }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    const x1 = x || this.emptyEtc
    const y1 = y || this.emptyEtc
    return (x1['nomAuteur'] === y1['nomAuteur']) && (x1['section'] === y1['section'])
  }
  async checkEtc (etc: Object | null) : Promise<string> {
    const na = etc['nomAuteur']
    if (!na) return $t('FORM_AS2_diag_nomAuteur2')
    const autid = await AS2$Auteur.autidParNom(this.soa, na)
    if (autid) return $t('FORM_AS2_diag_nomDupl')
    return ''
  }

  async compileEtc (etc: Object, byU: boolean) : Promise<void> { // en chantier
    if (!byU) return
    const nomAuteur = etc['nomAuteur']
    const autid = Crypt.rnd(15)
    const ct = await $CredTempl.new(this.userId, this.svc, this.org, 'Auteur', 
      { autid: autid }, nomAuteur, { name: nomAuteur })
    this.opts = {
      auteur: { autid, nomAuteur, section: etc['section'] },
      credTemplates: {}
    }
    this.opts.credTemplates[ct.credId] = ct
  }

}
if (ok) { n++; Registry.register(AS2$Form_auteur) }

class AS2$Form_coauteur extends $Form {
  autid: string = ''
  emptyEtc = { nomAuteur: '', trigramme: '' }

  constructor () { super() }

  cloneEtc (byU: boolean) : Object | null {
    const etc = byU ? this.etcU : this.etcT
    return { 
      trigramme: !etc ? '' : etc['trigramme'],
      nomAuteur: !etc ? '' : etc['nomAuteur']
    }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    const x1 = x || this.emptyEtc
    const y1 = y || this.emptyEtc
    return (x1['trigramme'] === y1['trigramme']) && (x1['nomAuteur'] === y1['nomAuteur'])
  }
  async checkEtc (etc: Object | null) : Promise<string> {
    const na = etc['nomAuteur']
    if (!na) return $t('FORMdiag_AS2_nomAuteur2')
    this.autid = await AS2$Auteur.autidParNom(this.soa, na)
    if (!this.autid) return $t('FORM_AS2_diag_nomInexistant')
    return ''
  }

  async compileEtc (etc: Object, byU: boolean) : Promise<void> { // en chantier
    if (!byU || !this.autid) return
    const na = etc['nomAuteur']
    const trigramme = etc['trigramme']
    const ct = await $CredTempl.new(this.userId, this.svc, this.org, 'Auteur', 
      { autid: this.autid } , na, { name: na, trig: trigramme })
    this.opts = {
      $1: DocDescriptor.get(this.svc + '$Auteur').pkValue({ autid: this.autid }),
      auteur: { autid: this.autid, nomAuteur: na },
      credTemplates: {}
    }
    this.opts.credTemplates[ct.credId] = ct
  }
}
if (ok) { n++; Registry.register(AS2$Form_coauteur) }

export const AS2nbForms = () : number => n