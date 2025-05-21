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
import { decode } from '@msgpack/msgpack'
import { b64ToObj } from 'src/app/util'


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
  console.log('notificationclick')

  // @ts-ignore
  const urlToOpen = event?.notification?.data?.url 
  if (!urlToOpen) return
  // Focus OR Open the URL in the default browser.
  // @ts-ignore
  const windowClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
  // console.log('notificationclick Clients: ' + windowClients.length)
  let found = false
  let promise
  for (const client of windowClients) {
    if (client.url.startsWith(urlToOpen) && client.focus) {
      if (client.visibilityState === 'hidden') // "hidden", "visible", or "prerender"
      promise = client.focus()
      found = true
      break
    }
  }

  // @ts-ignore
  if (!found && clients.openWindow) {
    promise = new Promise(function(resolve) {
        setTimeout(resolve, 3000);
      }).then(() => {
          // return the promise returned by openWindow, just in case.
          // Opening any origin only works in Chrome 43+.
          // @ts-ignore
          return clients.openWindow(urlToOpen)
      });

    // Now wait for the promise to keep the permission alive.
    // @ts-ignore
  }

  // @ts-ignore
  event.waitUntil(promise)
  // @ts-ignore
  event.notification.close() // CLosing the notification when clicked
})

// Gestion de Web-Push *******************************************************************
self.addEventListener('push', async (event) => {
  // @ts-ignore
  const buf = event.data ? event.data.text() : null
  try {
    // @ts-ignore
    const windowClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    let found = false
    for (const client of windowClients) {
      if (client.focus && (client.visibilityState === 'hidden' || client.visibilityState === 'visible'))  { // "hidden", "visible", or "prerender"
        client.postMessage({ type: 'PUSH', payload: buf })
        found = true
      }
    }
    if (!found) { // Pas d'appli ni bg ni fg - notification par browser
      /*
      const message = {
        notification: {
          title: 'Hello',
          body: 'Depuis serveur'
        },
        data: { 
          url: this.params.appurl || '',
          notifme: ''
        }
      }
      */
      const payload = b64ToObj(buf)
      // @ts-ignore
      const options = { body: 'From browser: ' + payload.notification.body }
      // @ts-ignore
      if (payload.data.url) options.data = { url: payload.data.url }
      // @ts-ignore
      await self.registration.showNotification(payload.notification.title, options)
    }
  } catch (e) {
    console.log('SW: error on push: ' + e.toString())
  }
})
