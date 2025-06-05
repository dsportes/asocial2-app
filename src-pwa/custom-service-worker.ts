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
    // usage futur ?
    console.log('SW: App closing')
  } else if (event.data && event.data.type === 'FROM_APP') {
    // usage futur ?
    console.log('SW: call from App:' + JSON.stringify(event.data))
  }
})

self.addEventListener('notificationclick', (event) => {
  console.log('SW: On notification click')
  // @ts-ignore
  event.notification.close()
  // @ts-ignore
  const urlToOpen = event?.notification?.data?.url 
  if (!urlToOpen) return

  // This looks to see if the current is already open and focuses if it is
  // @ts-ignore
  event.waitUntil( clients.matchAll({type: 'window'})
    .then((clientList) => {
      for (const client of clientList)
        if ('focus' in client) return client.focus()
      // @ts-ignore
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  )
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
      /* const message = {
        notification: { title: 'Hello', body: 'Depuis serveur' },
        data: { url: 'http...', notifme: ''}
      } */
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
