import { defineBoot } from '#q-app/wrappers'
import { useConfigStore } from '../stores/config-store.js'

export default defineBoot(async ({ app }) => {
  console.log('appconfig')
  const config = useConfigStore()
  config.setLocaleOptions([
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ])

  config.dataSt.setCpt(3)
})
