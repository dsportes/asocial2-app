// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import stores from '../stores/all'

import { docTypeErrors, docTypeNb } from '../app/docschema'
import { setHelp } from '../app/apphelp'

export default defineBoot(async ({ app }) => {
  stores.config.initK()

  if (docTypeErrors.length) {
    console.error(docTypeErrors.join('\n'))
    if (alert) window.alert('appconfig: ' + docTypeErrors.length + ' compile schema errors')
  } else
    console.log(docTypeNb + ' document classes found')
  
  setHelp()
})
