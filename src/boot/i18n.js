import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

import { useConfigStore } from '../stores/config-store.js'

export default defineBoot(({ app }) => {
  const config = useConfigStore()

  const i18n = createI18n({
    locale: config.locale,
    globalInjection: true,
    legacy: false,
    messages
  })

  // Set i18n instance on app
  app.use(i18n)
})
