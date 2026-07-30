// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import stores from '../stores/all'
import { setHelp } from '../app/apphelp'

import { schemaExcAS2 } from '../as2/schema'
import { schemaExcFW } from '../src-fw/schema'
import { AS2nbDocs } from '../as2/documents'
import { AS2nbForms } from '../as2/forms'
import { AS2nbCreds } from '../as2/credentials'
import { FWnbDocs } from '../src-fw/fwdocuments'

export default defineBoot(async ({ app }) => {
  stores.config.initK()

  let exc = schemaExcAS2()
  if (!exc) exc = schemaExcFW()
  if (exc) {
    alert(exc.toString())
  } else {
    console.log(AS2nbDocs() + ' documents loaded')
    console.log(AS2nbForms() + ' forms loaded')
    console.log(AS2nbCreds() + ' credentials loaded')
    console.log(FWnbDocs() + ' FW documents loaded')
  }

  setHelp()
})
