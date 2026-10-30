import {Descriptor, collection, idx, propType } from '../src-fw/descriptor'

Descriptor.registerService('ADMIN')

export default {
  ADMIN$Status: Descriptor.doc('ADMIN', 'Status', { }),

}
