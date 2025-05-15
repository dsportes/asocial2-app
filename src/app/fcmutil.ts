// Import the functions you need from the SDKs you need
// @ts-ignore
// import { initializeApp } from 'firebase/app'
// @ts-ignore
import { getToken } from 'firebase/messaging'
// @ts-ignore
import { messaging } from '../../src-pwa/register-service-worker'

import { K } from './constants'

export async function initFCM () {

  try {
    const token = await getToken(messaging, {vapidKey: K.vapidPublicKey})
    if (token) {
      console.log('token: ', token)
      // Send the token to your server and update the UI if necessary
      // ...
    } else {
      // Show permission request UI
      console.log('No registration token available. Request permission to generate one.')
      // ...
    } 
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err)
  }

}
