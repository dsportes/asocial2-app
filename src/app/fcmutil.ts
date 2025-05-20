import { firebaseConfig } from './firebaseConfig'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { postOp, config, objToB64 } from './util'

export async function initFCM () {
  try {
    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { serviceWorkerRegistration: config.registration })
    if (!token) {
      console.log('FCM - cannot get token.')
      // TODO
      return
    }
    config.setToken(token)
    onMessage(messaging, async (payload) => {
      await onmsg(payload, false)
    })
    await postToken()
    console.log('FCM - initialization DONE.')
  } catch (e) {
    console.log('FCM - initialization failed: ', e.toString())
    // TODO
  }
}

export async function postToken () {
  try {
    await postOp('RegisterToken', { token: config.token })
  } catch (err) {
    console.log('An error occurred while retrieving token (2).', err)
    // TODO
  }
}

export async function onmsg (payload: any, bg: boolean) {
  console.log('Message received sur onMessage - ' + (bg ? 'BACKGROUND' : ''))
  
  // Choix du test: on ne dédouble pas la notification faite par FCM
  // et le message du serveur sollicite une notif
  if (!bg && payload?.data?.notifme) {
    showNotifFG(payload)
  }
}

function showNotifFG (payload: any) {
  const msgid = payload.messageId
  console.log('Show notif EXPLICITE de foreground: ', msgid)
  const options = { body: 'Reçu en foreground: ' + payload.notification.body }
  // @ts-ignore
  if (payload.data.url) options.data = { url: payload.data.url }
  // @ts-ignore
  config.registration.showNotification(payload.notification.title, options)
}
