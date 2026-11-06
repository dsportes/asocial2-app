import {Descriptor } from '../src-fw/descriptor'

Descriptor.registerService('ADMIN')

export default {
  ADMIN$Status: Descriptor.doc('ADMIN', 'Status', { }),
  /* Sur le serrver : ???
   ADMIN$Status: Descriptor.doc('ADMIN', 'Status', { pk: ['svc'], nohash: true }),
  */
}
