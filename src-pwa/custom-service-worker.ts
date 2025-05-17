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
  }
  else if (event.data && event.data.type === 'FOCUS') {
    // @ts-ignore
    console.log('SW: focus: ' + (event.data.arg ? 'ON' : 'OFF'))
  }
  else if (event.data && event.data.type === 'STARTING') {
    console.log('SW: Duplicate App detection')
    // @ts-ignore
    event.waitUntil(
      // @ts-ignore
      clients.matchAll().then((clientList) => {
        for(const client of clientList)
          // @ts-ignore
          if (client.id !== event.source.id) event.source.postMessage({ type: 'STOP' })
      })
    )
  }
})

/*
import { getMessaging } from "firebase/messaging/sw";
import { onBackgroundMessage } from "firebase/messaging/sw";

const messaging = getMessaging();
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
*/

import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { initializeApp } from "firebase/app"

initializeApp({
    apiKey: "AIzaSyCj0MhJu2Q190ucs71PVv2XPH2SdnTfj1M",
    authDomain: "asocial2.firebaseapp.com",
    projectId: "asocial2",
    storageBucket: "asocial2.firebasestorage.app",
    messagingSenderId: "286456497845",
    appId: "1:286456497845:web:7171b8915f42d3c087e0fc"
})

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = getMessaging();

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };
// @ts-ignore
  self.registration.showNotification(notificationTitle,
    notificationOptions);
})

