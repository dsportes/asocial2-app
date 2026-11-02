import { register } from 'register-service-worker'

/*
onfocus = (event) => { useConfigStore().getFocus() }
onblur = (event) => { useConfigStore().lostFocus() }
onbeforeunload = (event) => { useConfigStore().closingApp() }
*/

export let myRegistration = null
export let _onAppUpdate = null
export function setOnAppUpdate(f: any) {
  _onAppUpdate = f
}

register('./sw.js', {

  registered (registration) {
    // @ts-expect-error
    myRegistration = registration
    const ok = myRegistration ? 'ok' : 'KO'
    console.log('Service worker is registered', ok)
  },

  ready (registration) {
    // @ts-expect-error
    myRegistration = registration
    const ok = myRegistration ? 'ok' : 'KO'
    console.log('Service worker is active', ok)
    // @ts-expect-error
    registration.active.postMessage({ type: 'STARTING' })
  },

  updated (/* registration */) {
    if (_onAppUpdate)
      // @ts-expect-error
      _onAppUpdate()
  },

  cached (/* registration */) { }, // console.log('Content has been cached for offline use.')
  updatefound (/* registration */) { }, // console.log('New content is downloading.')
  offline () { }, // console.log('No internet connection found. App is running in offline mode.')
  error (/* err */) { } // console.error('Error during service worker registration:', err)
})
