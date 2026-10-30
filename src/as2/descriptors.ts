import {Descriptor, collection, idx, propType } from '../src-fw/descriptor'

Descriptor.registerService('AS2')

export default {

  AS2$Status : Descriptor.doc('AS2', 'Status', { }),
  AS2$Codir : Descriptor.doc('AS2', 'Codir', { virtual: true }),
  AS2$Redaction : Descriptor.doc('AS2', 'Redaction', { virtual: true }),
  AS2$Section:  Descriptor.enum('AS2', 'Section', { virtual: true, enumCred: 'Redaction' }),
  AS2$Sujet : Descriptor.enum('AS2', 'Sujet', { virtual: true, enumCred: 'CoDir' }),
  AS2$Auteur: Descriptor.doc('AS2', 'Auteur', { pk: ['autid'] }),
  AS2$SubsGenerator  : Descriptor.doc('AS2', 'SubsGenerator', { }),
  AS2$Publication : Descriptor.doc('AS2', 'Publication', { pk: ['pubid'], sync: true },
    new Map<string, collection>([
      ['sujets',  { key: ['sujets'], list: true, mutable: true, class: 'Sujet' }],
      ['auteur',  { key: ['autid'], mutable: false, class: "Auteur" }]
    ]),
    new Map<string, idx>([
      ['volume',  { type: propType.INTEGER, key: ['volume'] }]
    ])),

  AS2$Form : Descriptor.doc('AS2', 'Form',
    { pk: ['formId'], nohash: true, subClassBy: 'type' }),

  AS2$Credential: Descriptor.doc('AS2', 'Credential',
      { pk: ['credId'], nohash: true, subClassBy: 'docCl' }),

}
