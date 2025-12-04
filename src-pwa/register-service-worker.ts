// @ts-ignore
import { register } from 'register-service-worker'
import { urlFromText, b64ToObj } from '../src/src-fw/util'
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

type messageNotif = {
  org: string // 'demo'
  title: string // 'myApp - demo', 
  body: string // 'Chat reçu',
  url: string // 'http...'
  defs: string[] // [a/v/c c/d/e ...]
}

/* Traitement des notifications:
- sur retour d'opération
- sur web-push
*/
export async function onPushMsg (payload: string) {
  if (payload) {
    const messageNotif = b64ToObj(payload)
    if (messageNotif.defs && messageNotif.defs.length)
      await stores.data.onNotif(messageNotif.now, messageNotif.org, messageNotif.defs)
    if (messageNotif.body) {
      const config = stores.config
      if (config.mondebug) console.log('Show notif EXPLICITE from app')
      const options = { body: messageNotif }
      // @ts-ignore
      if (messageNotif.url) options.data = { url: payload.data.url || config.location }
      const t = messageNotif.title || (config.K.APPNAME + ' - ' + messageNotif.org)
      // @ts-ignore
      await session.registration.showNotification(t, options)
    }
  }
}

// Traite les messages émis par le SW 
navigator.serviceWorker.onmessage = async (message) => {
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
    console.log('Service worker is registered')
  },

  ready (registration) { 
    console.log('Service worker is active')
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
