// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import stores from '../stores/all'
import { setHelp } from '../app/apphelp'
import { AS2docLoading } from '../as2/documents'
import { AS2formsLoading } from '../as2/forms'

// import { Registry } from '../src-fw/registry'

export default defineBoot(async ({ app }) => {
  stores.config.initK()

  AS2docLoading()
  AS2formsLoading()

  /* Test
  const cl = Registry.getClass('AS2', 'Credential', { docCl: 'Auteur' })
  const cred = Registry.newC('AS2', 'Credential', { docCl: 'Auteur' })
  console.log(cred.descriptor().subClassBy)
  const pk = Registry.getPk('AS2', 'Credential', { docCl: 'Auteur', credId: 'toto'})
  */

  setHelp()
})
