import { DocDescriptor, FormType } from '../src-fw/docDescriptor'

let exc: Error | null = null

let svc = DocDescriptor.declareService('ADMIN')
try {
  const nd = DocDescriptor.size()
  const nf = FormType.size()
  
  new DocDescriptor(svc, { name: 'Status', sync: false, pk:['svc'], nohash: true } )

  console.log('FW document descriptors:' + (DocDescriptor.size() - nd) 
    + ' forms descriptors:' + (FormType.size() - nf))

} catch (e: any) {
  exc = e
}

export const schemaExcFW = () : Error | null => {
  if (exc)  console.log('Schema Exception: ', exc.toString())
  return exc
}
