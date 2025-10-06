// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
import { docTypeErrors } from '../app/docschema'
import { DocType } from '../src-fw/doctypes'
import { useConfigStore } from '../stores/config-store'
import { K } from '../app/constants'

export default defineBoot(async ({ app }) => {
  console.log('appconfig')

  const cfg = useConfigStore()
  cfg.initK(K)
  // console.log(cfg.location)

  if (docTypeErrors.length) {
    console.error(docTypeErrors.join('\n'))
    window.alert(docTypeErrors.length + ' compile schema errors')
  } else console.log(DocType.docTypes.size + ' document classes')

})
