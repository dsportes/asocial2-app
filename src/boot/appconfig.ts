// @ts-ignore
import { defineBoot } from '#q-app/wrappers'

import { docTypeErrors } from '../app/docschema'
import { DocType } from '../src-fw/doctypes'
import { K } from '../app/constants'
import stores from '../stores/all'

export default defineBoot(async ({ app }) => {
  stores.config.initK(K)

  if (docTypeErrors.length) {
    console.error(docTypeErrors.join('\n'))
    window.alert('appconfig: ' + docTypeErrors.length + ' compile schema errors')
  } else console.log('appconfig: ' + DocType.docTypes.size + ' document classes')

})
