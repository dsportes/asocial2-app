import { sha224 } from 'js-sha256'

import { getToken } from 'firebase/messaging'
import { messaging } from '../../src-pwa/register-service-worker'

import { K } from './constants'
import { postOp } from './util'

export function shortHash (s: string) { return sha224(s).substring(0, 16) }

export const token = {
  token: null,
  hash: ''
}

export async function initFCM () {
  try {
    token.token = await getToken(messaging, {vapidKey: K.vapidPublicKey})
    if (token.token) {
      token.hash = shortHash(token.token)
      console.log('token: [' + token.hash + '] - [' + token.token + ']')
      await postOp('RegisterToken', { token: token.token })
    } else {
      // Show permission request UI
      console.log('No registration token available. Request permission to generate one.')
      // TODO
    } 
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err)
    // TODO
  }
}

export function onPaylaod (payload) {
  console.log(JSON.stringify(payload))
}
