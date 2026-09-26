// @ts-ignore
import { defineBoot } from '#q-app/wrappers'
// @ts-ignore
import { Lang } from 'quasar'
// import langFr from 'quasar/lang/fr'
// import langEn from 'quasar/lang/en'

export const langs = {}

export default defineBoot(async () => {
  try {
    let lx = Lang.getLocale()
    console.log(lx)
    // langs.fr = langFr
    //langs.en = langEn
    // Lang.set()
    // lx = Lang.getLocale()
    // console.log(lx)
  } catch(err) {
    console.error(err)
    // Requested Quasar Language Pack does not exist,
    // let's not break the app, so catching error
  }
})