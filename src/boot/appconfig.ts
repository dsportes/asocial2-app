// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
// import { useConfigStore } from '../stores/config-store';
import { compileReport } from '../app/doctypes'

export default defineBoot(async ({ app }) => {
  console.log('appconfig')
  // const config = useConfigStore()
  
  const n = compileReport()
  console.log('Types compile : ' + (n ? n + ' errors' : 'OK'))

})
