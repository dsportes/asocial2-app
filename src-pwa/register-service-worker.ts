// @ts-ignore
import { register } from 'register-service-worker'
import { useConfigStore } from '../src/stores/config-store'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

navigator.serviceWorker.onmessage = (message) => {
  if (message.data) console.log(JSON.stringify(message.data))
  if (message.data && message.data.type === 'STOP') {
    const config = useConfigStore()
    config.setSTOP(message.data.idx)
  }
}

register('./totosw.js', {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (registration) {
    console.log('DS >> Service worker is active.')
    const config = useConfigStore()
    config.setRegistration(registration)
  },

  registered (/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached (/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound (/* registration */) {
    // console.log('New content is downloading.')
  },

  updated (/* registration */) {
    // console.log('New content is available; please refresh.')
  },

  offline () {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error (/* err */) {
    // console.error('Error during service worker registration:', err)
  }
})
