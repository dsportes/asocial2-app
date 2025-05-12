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

self.skipWaiting()
clientsClaim()
const mf = self.__WB_MANIFEST
console.log('Dans SW')
console.log('WB_MANIFEST >>>>>>>')
mf.forEach(x => {
  // @ts-ignore
  console.log('WB_MANIFEST: ' + x.url)
})
console.log('WB_MANIFEST <<<<<<<')

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
    console.log('Appel depuis app:' + JSON.stringify(event.data.payload))
  }
  if (event.data && event.data.type === 'STARTING') {
    console.log('STARTING (dans SW)')
    event.waitUntil(
      clients
        .matchAll()
        .then((clientList) => {
          const myId = event.source.id
          let n = 0
          let idx
          for(const client of clientList) {
            if (client.id !== myId) { n++; idx = client.id }
          }
          console.log(n + ' autres clients ouverts')
          if (idx) {
            event.source.postMessage({ type: 'STOP', idx: idx })
          }
        })
    )
  }
})

