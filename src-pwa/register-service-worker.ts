// @ts-ignore
import { register } from 'register-service-worker'
import { useConfigStore } from '../src/stores/config-store'
import { urlFromText } from '../src/app/util'
import { onPaylaod } from '../src/app/fcmutil'
import { K } from '../src/app/constants'
import { firebaseConfig } from '../src/app/firebaseConfig'
import { initializeApp } from 'firebase/app'
import { getMessaging, onMessage } from 'firebase/messaging'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

navigator.serviceWorker.onmessage = (message) => {
  if (message.data && message.data.type === 'STOP') {
    window.location.href = urlFromText(K.byeHtml)
  }
  useConfigStore().onSwMessage(message.data)
}

onfocus = (event) => {
  useConfigStore().getFocus()
}

onblur = (event) => {
  useConfigStore().lostFocus()
}

onbeforeunload = (event) => {
  useConfigStore().callSW('App closing')
}

export const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)
onMessage (messaging, (payload) => {
  console.log('Message received. ', payload);
  onPaylaod(payload)
  // ...
})


register('./firebase-messaging-sw.js', {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (registration) {
    console.log('Service worker is active')
    useConfigStore().setRegistration(registration)
    registration.active.postMessage({ type: 'STARTING' })
    // @ts-ignore
    messaging.useServiceworker(registration)
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
    useConfigStore().setAppUpdated()
  },

  offline () {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error (/* err */) {
    // console.error('Error during service worker registration:', err)
  }
})
