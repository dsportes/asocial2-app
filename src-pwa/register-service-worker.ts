// @ts-ignore
import { register } from 'register-service-worker'
import { urlFromText } from '../src/src-fw/util'
import stores from '../src/stores/all'
import { onPushMsg } from '../src/stores/docs'

// Ecoute les changements de permissions et les route vers config
navigator.permissions.query({ name: 'notifications' })
.then(notificationPerm => {
  const session = stores.session
  notificationPerm.onchange = () => {
    const p = notificationPerm.state
    session.changePerm(p)
  }
  const p = notificationPerm.state
  session.changePerm(p)
})
.catch(e => {
  console.log('Permissions cannot be asked')
})

// Traite les messages émis par le SW 
navigator.serviceWorker.onmessage = async (message) => {
  try {
    if (message.data) {
      if (message.data.type === 'STOP') {
        window.location.href = urlFromText(stores.config.K.byeHtml)
      } else if (message.data.type === 'PUSH') {
        console.log('Notification received by web-push')
        await onPushMsg(message.data.payload)
      } else {
        stores.session.onSwMessage(message.data)
      }
    }
  } catch (e) { 
    console.log(e)
  }
}

/*
onfocus = (event) => { useConfigStore().getFocus() }
onblur = (event) => { useConfigStore().lostFocus() }
onbeforeunload = (event) => { useConfigStore().closingApp() }
*/

export let myRegistration = null

register('./firebase-messaging-sw.js', {

  registered (registration) { 
    myRegistration = registration
    const ok = myRegistration ? 'ok' : 'KO'
    console.log('Service worker is registered', ok)
  },

  ready (registration) { 
    myRegistration = registration
    const ok = myRegistration ? 'ok' : 'KO'
    console.log('Service worker is active', ok)
    registration.active.postMessage({ type: 'STARTING' })
  },

  updated (/* registration */) {
    stores.session.setAppUpdated()
  },

  cached (/* registration */) { }, // console.log('Content has been cached for offline use.')
  updatefound (/* registration */) { }, // console.log('New content is downloading.')
  offline () { }, // console.log('No internet connection found. App is running in offline mode.')
  error (/* err */) { } // console.error('Error during service worker registration:', err)
})
