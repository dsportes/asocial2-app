import { DocDescriptor, FormType } from '../src-fw/docDescriptor'

let exc: Error | null = null

let svc = DocDescriptor.declareService('AS2')
try {
  const nd = DocDescriptor.size()
  const nf = FormType.size()

  new DocDescriptor(svc, { name: 'Credential', pk: ['credId'], nohash: true, subClassBy: 'docCl' })
  new DocDescriptor(svc, { name: 'Form', pk: ['formId'], nohash: true, subClassBy: 'type' })
  new DocDescriptor(svc, { name: 'Section', enum: ['roman', 'histoire', 'sf'] })
  new DocDescriptor(svc, { name: 'Auteur', pk: ['autId'] })

  new FormType(svc, 'membrecodir', 'ad', 'k1', ['A'])
  new FormType(svc, 'membreredaction', 'ad', 'k1', ['A'])
  new FormType(svc, 'auteur', 'auteurs', 'k2', ['Redaction/1'])
  // Un Auteur peut aussi nommer un co-auteur
  new FormType(svc, 'coauteur', 'auteurs', 'k2', ['Redaction/1', 'Auteur/$1'])

  console.log('AS2 document descriptors:' + (DocDescriptor.size() - nd) 
    + ' forms descriptors:' + (FormType.size() - nf))

} catch (e: any) {
  exc = e
}

export const schemaExc = () : Error | null => {
  if (exc)  console.log('Schema Exception: ', exc.toString())
  return exc
}
