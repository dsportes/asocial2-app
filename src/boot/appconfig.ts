// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
import { useConfigStore, localeOption } from '../stores/config-store';

export default defineBoot(async ({ app }) => {
  console.log('appconfig')
  const config = useConfigStore()
  config.resetLocaleOptions([
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ])

  config.dataSt.setCpt(3)
})
