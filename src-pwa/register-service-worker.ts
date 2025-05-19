// @ts-ignore
import { register } from 'register-service-worker'
import { useConfigStore } from '../src/stores/config-store'
import { urlFromText } from '../src/app/util'
import { onmsg } from '../src/app/fcmutil'
import { K } from '../src/app/constants'
import { firebaseConfig } from '../src/app/firebaseConfig'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

navigator.serviceWorker.onmessage = (message) => {
  if (message.data && message.data.type === 'STOP') {
    window.location.href = urlFromText(K.byeHtml)
  }
  useConfigStore().onSwMessage(message.data)
}

/*
onfocus = (event) => { useConfigStore().getFocus() }
onblur = (event) => { useConfigStore().lostFocus() }
onbeforeunload = (event) => { useConfigStore().closingApp() }
*/

export const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)

/* 
Pour que SW de FCM s'initialise avec un firebase-messaging-sw.js
qui N'EST PAS à la racine du domaine, il faut demander un token
juste après obtention de registration.
MAIS il faut que la permiison de notification ait été préalablement accordée.
*/

const notificationPerm = await navigator.permissions.query({ name: 'notifications' })
notificationPerm.onchange = async () => {
  const config = useConfigStore()
  const p = notificationPerm.state
  config.changePerm(p)
}

if (notificationPerm.state === 'granted') {
  myRegister()
} else {
  const config = useConfigStore()
  config.askForPerm(notificationPerm.state)
  config.permState = notificationPerm.state
  config.permDialog = true
}

export function myRegister() {
  register('./firebase-messaging-sw.js', {
    ready (registration) {
      const config = useConfigStore()
      // @ts-ignore
      getToken(messaging, { serviceWorkerRegistration: registration })
      .then((token) => {
        console.log('Service worker is active')
        config.setToken(token)
        config.setRegistration(registration)
        registration.active.postMessage({ type: 'STARTING' })
        onMessage(messaging, onmsg)
      })
      .catch((e) => {
        console.log('<<<<<<<<<<<<<<<<<<<<< ' + e.toString())
        // TODO
      })
    },

    updated (/* registration */) {
      useConfigStore().setAppUpdated()
    },

    registered (/* registration */) { } ,// console.log('Service worker has been registered.')
    cached (/* registration */) { }, // console.log('Content has been cached for offline use.')
    updatefound (/* registration */) { }, // console.log('New content is downloading.')
    offline () { }, // console.log('No internet connection found. App is running in offline mode.')
    error (/* err */) { } // console.error('Error during service worker registration:', err)
  })
}
