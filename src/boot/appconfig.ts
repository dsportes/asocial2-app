// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

import stores from '../stores/all'

import { loadingTypes } from '../app/docschema'
import { setHelp } from '../app/apphelp'

export default defineBoot(async ({ app }) => {
  stores.config.initK()
  loadingTypes(true)
  setHelp()
})
