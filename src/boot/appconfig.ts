// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'
// @ts-ignore
import { Lang } from 'quasar'
import langFr from 'quasar/lang/fr'
import langDe from 'quasar/lang/de'

export let app = ''

export const localeOptions = [
  { value: 'fr', label: 'Français 🇫🇷', flag: '🇫🇷', name: 'Français', props: langFr },
  { value: 'en', label: 'English 🇬🇧',  flag: '🇬🇧', name: 'English' }
]

// export default defineBoot(async ({ app }) => {
export default defineBoot(async (arg) => {
  app = arg.app
})
