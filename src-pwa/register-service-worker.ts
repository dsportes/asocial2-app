// @ts-ignore
import { register } from 'register-service-worker'
import { useConfigStore } from '../src/stores/config-store'
import { urlFromText, b64ToObj } from '../src/app/util'
import { onmsg } from '../src/app/fcmutil'
import { K } from '../src/app/constants'

// Ecoute les changements de permissions et les route vers config
navigator.permissions.query({ name: 'notifications' })
.then(notificationPerm => {
  const config = useConfigStore()
  notificationPerm.onchange = () => {
    const p = notificationPerm.state
    config.changePerm(p)
  }
  const p = notificationPerm.state
  config.changePerm(p)
})
.catch(e => {
  console.log('Permissions cannot be asked')
})

// Traite les messages émis par le SW 
navigator.serviceWorker.onmessage = async (message) => {
  if (message.data) {
    if (message.data.type === 'STOP') {
      window.location.href = urlFromText(K.byeHtml)
    } else if (message.data.type === 'ONBG') {
      const payload = b64ToObj(message.data.payload)
      await onmsg(payload, true)
    } else {
      useConfigStore().onSwMessage(message.data)
    }
  }
}

/*
onfocus = (event) => { useConfigStore().getFocus() }
onblur = (event) => { useConfigStore().lostFocus() }
onbeforeunload = (event) => { useConfigStore().closingApp() }
*/

register('./firebase-messaging-sw.js', {

  registered (registration) { 
    console.log('Service worker is registered')
    const config = useConfigStore()
    config.setRegistration(registration)
  } ,// console.log('Service worker has been registered.')

  ready (registration) { 
    console.log('Service worker is active')
    registration.active.postMessage({ type: 'STARTING' })
  },

  updated (/* registration */) {
    useConfigStore().setAppUpdated()
  },

  cached (/* registration */) { }, // console.log('Content has been cached for offline use.')
  updatefound (/* registration */) { }, // console.log('New content is downloading.')
  offline () { }, // console.log('No internet connection found. App is running in offline mode.')
  error (/* err */) { } // console.error('Error during service worker registration:', err)
})
