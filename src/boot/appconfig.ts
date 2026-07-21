// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import stores from '../stores/all'
import { setHelp } from '../app/apphelp'

import { schemaExc } from '../as2/schema'
import { AS2nbDocs } from '../as2/documents'
import { AS2nbForms } from '../as2/forms'
import { AS2nbCreds } from '../as2/credentials'

export default defineBoot(async ({ app }) => {
  stores.config.initK()

  const exc = schemaExc()
  if (exc) {
    alert(exc.toString())
  } else {
    console.log(AS2nbDocs() + ' documents loaded')
    console.log(AS2nbForms() + ' forms loaded')
    console.log(AS2nbCreds() + ' credentials loaded')
  }

  setHelp()
})
