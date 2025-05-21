import { postOp, config } from './util'

export async function initWP () {
  if (config.subJSON.startsWith('???')) {
    console.log('WP - initialization failed: ', config.subJSON)
    // TODO
  } else try {
    await postOp('RegisterSubscription', { subJSON: config.subJSON })
    console.log('WP - initialization DONE. ', config.hashSub)
  } catch (e) {
    console.log('WP - initialization failed: ', e.toString())
    // TODO
  }
}

export async function onmsg (payload: any) {
  console.log('Message received by web-push')
  
  if (payload?.data?.notifme) {
    await showNotifFG(payload)
  }
}

async function showNotifFG (payload: any) {
  console.log('Show notif EXPLICITE from app')
  const options = { body: 'From app: ' + payload.notification.body }
  // @ts-ignore
  if (payload.data.url) options.data = { url: payload.data.url }
  // @ts-ignore
  await config.registration.showNotification(payload.notification.title, options)
}
