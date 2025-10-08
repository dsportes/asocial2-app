// @ts-ignore
import { register } from 'register-service-worker'
import { urlFromText, b64ToObj } from '../src/src-fw/util'
import { onmsg } from '../src/src-fw/wputil'
import stores from '../src/stores/all'

// import { decode } from '@msgpack/msgpack'

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
  if (message.data) {
    if (message.data.type === 'STOP') {
      window.location.href = urlFromText(stores.config.K.byeHtml)
    } else if (message.data.type === 'PUSH') {
      const payload = b64ToObj(message.data.payload)
      await onmsg(payload)
    } else {
      stores.session.onSwMessage(message.data)
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
    stores.session.setRegistration(registration, stores.config.K.vapidPublicKey)
  } ,// console.log('Service worker has been registered.')

  ready (registration) { 
    console.log('Service worker is active')
    registration.active.postMessage({ type: 'STARTING' })
    registration.active.postMessage({ type: 'SETSTATE', 
      location: stores.config.location, APPNAME: stores.config.K.APPNAME 
    })
  },

  updated (/* registration */) {
    stores.session.setAppUpdated()
  },

  cached (/* registration */) { }, // console.log('Content has been cached for offline use.')
  updatefound (/* registration */) { }, // console.log('New content is downloading.')
  offline () { }, // console.log('No internet connection found. App is running in offline mode.')
  error (/* err */) { } // console.error('Error during service worker registration:', err)
})
