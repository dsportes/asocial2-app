import stores from '../stores/all'
import { b64ToObj } from './util'

export async function initWP () {
  // POUR TEST de web-push: n'est plus opérationnel
  const session = stores.session
  if (session.subJSON.startsWith('???')) {
    console.log('WP - initialization failed: ', session.subJSON)
    // TODO
  } else try {
    // await postOp('RegisterSubscription', { subJSON: session.subJSON })
    console.log('WP - initialization DONE. ', session.sessionId)
  } catch (e) {
    console.log('WP - initialization failed: ', e.toString())
    // TODO
  }
}

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
export async function onmsg (payload: string) {
  if (payload) {
    const messageNotif = b64ToObj(payload)
    if (messageNotif.defs && messageNotif.defs.length)
      stores.data.onNotif(messageNotif.now, messageNotif.org, messageNotif.defs)
    if (messageNotif.body) 
      await showNotifFG(messageNotif)
  }
}

async function showNotifFG (messageNotif: messageNotif) {
  console.log('Show notif EXPLICITE from app')
  const options = { body: messageNotif }
  // @ts-ignore
  if (messageNotif.url) options.data = { url: payload.data.url }
  const t = messageNotif.title || ( stores.config.K.APPNAME + ' - ' + messageNotif.org)
  // @ts-ignore
  await session.registration.showNotification(t, options)
}
