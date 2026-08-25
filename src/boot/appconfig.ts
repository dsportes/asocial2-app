// @ts-nocheck
import { defineBoot } from '#q-app/wrappers'

export let app = null

// export default defineBoot(async ({ app }) => {
export default defineBoot(async (arg) => {
  app = arg.app
})
