// @ts-ignore
declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & { skipWaiting: () => void };

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */


import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

import { firebaseConfig } from '../src/app/firebaseConfig'
import { b64ToObj, objToB64 } from '../src/app/util'

self.skipWaiting()
clientsClaim()
const mf = self.__WB_MANIFEST
console.log('SW: WB_MANIFEST >>>>>>>')
mf.forEach(x => {
  // @ts-ignore
  console.log('WB_MANIFEST: ' + x.url)
})
console.log('SW: WB_MANIFEST <<<<<<<')

// Use with precache injection
if (process.env.PROD) {
  console.log('precacheAndRoute')
  precacheAndRoute(mf)
}

cleanupOutdatedCaches()

// Non-SSR fallbacks to index.html
// Production SSR fallbacks to offline.html (except for dev)

// @ts-ignore
if (process.env.PROD) {
  registerRoute(
    new NavigationRoute(
      // @ts-ignore
      createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML),
      // @ts-ignore
      { denylist: [new RegExp(process.env.PWA_SERVICE_WORKER_REGEX), /workbox-(.)*\.js$/] }
    )
  )
}

/* On peut appeler une fonction du SW depuis une app Web */
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'STARTING') {
    console.log('SW: detection of duplicate starting')
    // @ts-ignore
    const clientList = await clients.matchAll({ includeUncontrolled: true, type: 'window' })
    for(const client of clientList) {
      // @ts-ignore
      if (client.id !== event.source.id) event.source.postMessage({ type: 'STOP' })
    }
  } else if (event.data && event.data.type === 'CLOSING') {
    // utile un jour ?
    console.log('SW: App closing')
  } else if (event.data && event.data.type === 'FROM_APP') {
    // usage futur ?
    console.log('SW: call from App:' + JSON.stringify(event.data))
  }
})

self.addEventListener('notificationclick', async (event) => {
  // console.log('notificationclick')
  // @ts-ignore
  event.notification.close(); // CLosing the notification when clicked
  // @ts-ignore
  const urlToOpen = event?.notification?.data?.url 
  if (!urlToOpen) return
  // Focus OR Open the URL in the default browser.
  // @ts-ignore
  const windowClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
  // console.log('notificationclick Clients: ' + windowClients.length)
  let found = false
  for (const client of windowClients) {
    if (client.url.startsWith(urlToOpen) && client.focus) {
      if (client.visibilityState !== 'visible')
        try { client.focus(); /* console.log('FOCUS set !') */ } 
        catch (e) { console.log('Set Focus err: (' + client.url + ') ' + e.toString()) }
      found = true
    }
  }

  // @ts-ignore
  if (!found && clients.openWindow) clients.openWindow(urlToOpen)
})

// Gestion de FCM *******************************************************************
// Retrieve an instance of Firebase Messaging so that it can handle background messages.
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { initializeApp } from "firebase/app"

initializeApp(firebaseConfig)
const messaging = getMessaging()

onBackgroundMessage(messaging, async (payload) => {
  console.log('Received background message: ')
  // @ts-ignore
  const clientList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
  let found = false
  for(const client of clientList) {
    found = true
    client.postMessage({ type: 'ONBG', payload: objToB64(payload) })
  }
  // if (!found && payload?.data?.notifme) showNotif(payload, true) // ????
})