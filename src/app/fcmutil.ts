import { sha224 } from 'js-sha256'

import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from '../../src-pwa/register-service-worker'

// import { K } from './constants'
import { postOp, config, objToB64 } from './util'

export async function postToken () {
  try {
    await postOp('RegisterToken', { token: config.token })
  } catch (err) {
    console.log('An error occurred while retrieving token (2).', err)
    // TODO
  }
}

export async function onmsg (payload) {
  console.log('Message received sur onMessage.')
  /* Il n'y a aucune notification automatique dans le tray
  Si on veut notifier EXPLICITEMENT dans le tray payload.data.notifme 
  doit être un string non vide.
  */
  if (payload?.data?.notifme)
    config.callSW( { type: 'SHOWNOTIF', payload: objToB64(payload)})
}
