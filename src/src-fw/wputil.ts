import stores from '../stores/all'

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
  await session.registration.showNotification(payload.notification.title, options)
}
