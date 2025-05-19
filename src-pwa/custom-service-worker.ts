// @ts-ignore
declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & { skipWaiting: () => void };

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

// @ts-ignore
import { clientsClaim } from 'workbox-core'
// @ts-ignore
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
// @ts-ignore
import { registerRoute, NavigationRoute } from 'workbox-routing'

import { firebaseConfig } from '../src/app/firebaseConfig'

import { b64ToObj } from '../src/app/util'

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
// @ts-ignore
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
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FROM_APP') {
    console.log('SW: call from App:' + JSON.stringify(event.data))
  } else if (event.data && event.data.type === 'FOCUS') {
    // @ts-ignore
    console.log('SW: focus: ' + (event.data.arg ? 'ON' : 'OFF'))
  } else if (event.data && event.data.type === 'CLOSING') {
    console.log('SW: App closing')
  } else if (event.data && event.data.type === 'SHOWNOTIF') {
    const payload = b64ToObj(event.data.payload)
    showNotif(payload, false)
  } else if (event.data && event.data.type === 'STARTING') {
    console.log('SW: Duplicate App detection')
    // @ts-ignore
    event.waitUntil(
      // @ts-ignore
      clients.matchAll({ includeUncontrolled: true, type: 'all' }).then((clientList) => {
        for(const client of clientList)
          // @ts-ignore
          if (client.id !== event.source.id) event.source.postMessage({ type: 'STOP' })
      })
    )
  }
})

import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { initializeApp } from "firebase/app"

initializeApp(firebaseConfig)

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = getMessaging();

onBackgroundMessage(messaging, (payload) => {
  console.log('Received background message: ')
  /*
  Si payload.webpush.fcm_options.link : la notification dans le tray est automatique
  Sinon on peut notifier EXPLICITEMENT ici si payload.data.notifme n'est pas un string vide
  - l'URL est dans payload.data.url
  */
  if (payload?.data?.notifme) 
    showNotif(payload, true)
})

function showNotif (payload, bg: boolean) {
  const msgid = payload.messageId
  console.log('Show notif EXPLICITE: ', msgid)
  const options = {
    body: (bg ? 'Reçu par onBackground: ' : 'Reçu par onMsg: ') + payload.notification.body,
    data: { url: payload.data.url }
  }
  // @ts-ignore
  return self.registration.showNotification(
    payload.notification.title,
    options
  )
}

self.addEventListener('notificationclick', (event) => {
    console.log('notificationclick')
    // @ts-ignore
    event.notification.close(); // CLosing the notification when clicked
    // @ts-ignore
    const urlToOpen = event?.notification?.data?.url 
    if (!urlToOpen) return
    // Focus OR Open the URL in the default browser.
    // @ts-ignore
    event.waitUntil(
      // @ts-ignore
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
      // clients.matchAll({ includeUncontrolled: true, type: 'all' })
      // clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        console.log('notificationclick Clients: ' + windowClients.length)
        // Check if there is already a window/tab open with the target URL
        let found = false
        for (const client of windowClients) {
          console.log('client.url: ' + client.url + ' / toOpen: ' + urlToOpen)
          if (client.url.startsWith(urlToOpen) && client.focus) {
            if (!client.focused)
              try { 
                client.focus()
                console.log('FOCUS set !') 
              } catch (e) { 
                console.log('Set Focus err: (' + client.url + ') ' + e.toString())
              }
            found = true
          }
        }
        // If not, open a new window/tab with the target URL
        // @ts-ignore
        if (!found && clients.openWindow) 
          // @ts-ignore
          clients.openWindow(urlToOpen)
      })
    )
  })
