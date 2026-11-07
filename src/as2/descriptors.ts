import {Descriptor, type collection, type idx, propType } from '../src-fw/descriptor'

Descriptor.registerService('AS2')

export default {
  AS2$Status : Descriptor.doc('AS2', 'Status', { nohash: true }),
  AS2$Subs : Descriptor.doc('AS2', 'Subs',
    { pk: ['sessionId'], nohash: true },
    undefined,
    new Map<string, idx>([['defs', { type: propType.LIST}]])
  ),
  AS2$Credential: Descriptor.doc('AS2', 'Credential',
    { pk: ['credId'], nohash: true, subClassBy: 'docCl' },
    undefined,
    new Map<string, idx>([
      ['doc', { type: propType.HASH, key: ['docCl', 'docPk'], nohash: true }],
    ])
  ),
  AS2$Form : Descriptor.doc('AS2', 'Form',
    { pk: ['formId'], nohash: true, subClassBy: 'type' },
    undefined,
    new Map<string, idx>([
      ['creds', { type: propType.LIST, nohash: true }]
    ])
  ),
  AS2$Section:  Descriptor.enum('AS2', 'Section', { enumCred: 'Redaction' }),
  AS2$Sujet : Descriptor.enum('AS2', 'Sujet', { enumCred: 'CoDir' }),
  AS2$Auteur: Descriptor.doc('AS2', 'Auteur',
    { pk: ['autid'], sync: true, embedCreds: true },
    new Map<string, collection>([
      ['section',  { key: ['section'], mutable: true, class: 'Section' }]
    ]),
    new Map<string, idx>([
      ['nom',  { type: propType.STRING, key: ['nomAuteur'], testable: true }]
    ])
  ),
  AS2$Publication : Descriptor.doc('AS2', 'Publication',
    { pk: ['pubid'], sync: true },
    new Map<string, collection>([
      ['sujets',  { key: ['sujets'], list: true, mutable: true, class: 'Sujet' }],
      ['auteur',  { key: ['autid'], mutable: false, class: "Auteur" }]
    ]),
    new Map<string, idx>([
      ['volume',  { type: propType.INTEGER, key: ['volume'] }]
    ])
  ),
  AS2$Redaction : Descriptor.doc('AS2', 'Redaction', { virtual: true }),
  AS2$Codir : Descriptor.doc('AS2', 'Codir', { virtual: true }),

  AS2$SubsGenerator  : Descriptor.doc('AS2', 'SubsGenerator', { }),

}
