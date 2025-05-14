// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
import { useConfigStore } from '../stores/config-store';

export default defineBoot(async ({ app }) => {
  console.log('appconfig')
  const config = useConfigStore()
  config.dataSt.setCpt(3)
})
