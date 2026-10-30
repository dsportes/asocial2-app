import { AppExc } from '../src-fw/base'
import { Registry } from '../src-fw/registry'
import { $Form, $CredTempl } from '../src-fw/documents'
import { FormType } from '../src-fw/descriptor'
import d from './descriptors'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'
import { AS2$Auteur } from './documents'

let n = 0, nf = 0, exc: AppExc | undefined

if (!exc) { nf++; exc = FormType.register('AS2', 'membrecodir', 'AS2_ad', 'k1', ['A']) }
if (!exc) { nf++; exc = FormType.register('AS2', 'membreredaction', 'AS2_ad', 'k1', ['A']) }
if (!exc) { nf++; exc = FormType.register('AS2', 'auteur', 'AS2_auteurs', 'k2', ['Redaction/1']) }
// Un Auteur peut aussi nommer un co-auteur
if (!exc) { nf++; exc = FormType.register('AS2', 'coauteur', 'AS2_auteurs', 'k2', ['Redaction/1', 'Auteur/$1']) }

/* Classe ayant des sous-classes: *****************************************************
- aucun document n'est instantiable avec cette classe
*/
class AS2$Form extends $Form {
  static _descriptor = d.AS2$Form
}
if (!exc) { n++; exc = Registry.register(AS2$Form) }

/* Sous classes de AS2$Form ******************************************************
- N'A PAS de _descriptor
- est register en tant que sous-classe de AS2@Credential
*/
class AS2$Form_membrecomite extends AS2$Form {
  docCl: string

  emptyEtc = { pseudo: '' }

  constructor (docCl: string) {
    super(); this.docCl = docCl }

  /* Méthodes surchargées par type *******************************/
  cloneEtc (byU: boolean) : Object {
    if (byU) return { pseudo: this.etcU ? (this.etcU as any)['pseudo'] : '' }
    const alias = this.opts ? this.opts.alias || '' : ''
    return { pseudo: this.etcT ? (this.etcT as any)['pseudo'] : alias }
  }
  eqEtc (x: any, y: any) : boolean {
    const x1 = x || this.emptyEtc
    const y1 = y || this.emptyEtc
    return x1.pseudo === y1.pseudo
  }
  async checkEtc (etc: any) : Promise<string> {
    const p = etc['pseudo'] || ''
    return p.length < 4 || p.length > 24 ? $t('FORM_AS2_diag_lgp') : ''
  }

  async compileEtc (etc: any, byU: boolean) : Promise<void> {
    if (!byU) return
    const comment = $t('CREDON_' + this.docCl)
    const name = etc['pseudo']
    const ct = await $CredTempl.new(this.userId, this.svc || '', this.org || '', this.docCl,
      { pk: '1' }, comment, { name })
    this.opts.credTemplates[ct.credId] = ct
  }
}

class AS2$Form_membrecodir extends AS2$Form_membrecomite {
  constructor () { super('CoDir') }
}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Form_membrecomite, AS2$Form, 'membrecomite') }

class AS2$Form_membreredaction extends AS2$Form_membrecomite {
  constructor () { super('Redaction') }
}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Form_membreredaction, AS2$Form, 'membreredaction') }

class AS2$Form_auteur extends $Form {
  emptyEtc = { nomAuteur: '', section: '' }

  constructor () { super() }

  cloneEtc (byU: boolean) : Object {
    const etc: any = byU ? this.etcU : this.etcT
    return {
      nomAuteur: !etc ? '' : etc['nomAuteur'],
      section: !etc ? '' : etc['section']
    }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    const x1: any = x || this.emptyEtc
    const y1: any = y || this.emptyEtc
    return (x1['nomAuteur'] === y1['nomAuteur']) && (x1['section'] === y1['section'])
  }
  async checkEtc (etc: any | null) : Promise<string> {
    const na = etc ? etc['nomAuteur'] : undefined
    if (!na) return $t('FORM_AS2_diag_nomAuteur2')
    const autid = await AS2$Auteur.autidParNom(this.soa, na)
    if (autid) return $t('FORM_AS2_diag_nomDupl')
    return ''
  }

  async compileEtc (etc: any, byU: boolean) : Promise<void> { // en chantier
    if (!byU) return
    const nomAuteur = etc['nomAuteur']
    const autid = Crypt.rnd(15)
    const ct = await $CredTempl.new(this.userId, this.svc || '', this.org || '', 'Auteur',
      { autid: autid }, nomAuteur, { name: nomAuteur })
    this.opts = {
      auteur: { autid, nomAuteur, section: etc['section'] },
      credTemplates: {}
    }
    this.opts.credTemplates[ct.credId] = ct
  }

}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Form_auteur, AS2$Form, 'auteur') }

class AS2$Form_coauteur extends $Form {
  autid: string = ''
  emptyEtc = { nomAuteur: '', trigramme: '' }

  constructor () { super() }

  cloneEtc (byU: boolean) : Object {
    const etc: any = byU ? this.etcU : this.etcT
    return {
      trigramme: !etc ? '' : etc['trigramme'],
      nomAuteur: !etc ? '' : etc['nomAuteur']
    }
  }
  eqEtc (x: Object | null, y: Object | null) : boolean {
    const x1: any = x || this.emptyEtc
    const y1: any = y || this.emptyEtc
    return (x1['trigramme'] === y1['trigramme']) && (x1['nomAuteur'] === y1['nomAuteur'])
  }
  async checkEtc (etc: any | null) : Promise<string> {
    const na = etc['nomAuteur']
    if (!na) return $t('FORM_AS2_diag_nomAuteur2')
    this.autid = await AS2$Auteur.autidParNom(this.soa, na)
    if (!this.autid) return $t('FORM_AS2_diag_nomInexistant')
    return ''
  }

  async compileEtc (etc: any, byU: boolean) : Promise<void> { // en chantier
    if (!byU || !this.autid) return
    const na = etc['nomAuteur']
    const trigramme = etc['trigramme']
    const ct = await $CredTempl.new(this.userId, this.svc || '', this.org || '', 'Auteur',
      { autid: this.autid } , na, { name: na, trig: trigramme })
    this.opts = {
      $1: AS2$Auteur._descriptor.pkValue({ autid: this.autid }), // TOCHECK
      auteur: { autid: this.autid, nomAuteur: na },
      credTemplates: {}
    }
    this.opts.credTemplates[ct.credId] = ct
  }
}
if (!exc) { n++; exc = Registry.registerSubClass(AS2$Form_coauteur, AS2$Form, 'coauteur') }

export const AS2FormsReport = () : AppExc | undefined => {
  if (!exc)
    console.log(`AS2FormsLoading: ${n} documents, ${nf} forms`)
  else {
    console.log(`AS2FormsLoading FAILED: ${exc.toString()}`)
    return exc
  }
}
