
import stores from '../stores/all'
import { IDB } from './idb'
import { Subscription } from'./document'
import { SetSubscription } from './operations'
import { modes } from '../stores/session-store'

type age = {
  lsd: number // jour (EPOCH) de dernière synchro aboutie
}

export const initSync = async (dbReset: boolean) => {
  // Acquisition des souscriptions et documents
  const session = stores.session
  const dataSt = stores.data
  const config = stores.config

  session.setDbName('dbloc')
  session.setMode(modes.SYNC)
  if (dbReset)
    await IDB.delete(session.dbName)

  const idb = await IDB.open()

  const age = await idb.getState('age') as age
  const j = Math.floor(Date.now() / 86400000)
  const integral = !age.lsd || (j - age.lsd) > config.K.SYNCINCRNBD

  // Inscription en data-store des defs de toutes les sousciptions
  {
    const m = await idb.getSubs()
    for(const [org, mo] of m) {
      for(const [clazz, subs] of mo)
        dataSt.initDefs(org, clazz, subs)
    }
  }

  /* Enregistrement / abonnement au serveur des souscriptions de "session active"
  Redéfinition possible de title, donnée de url
  Des notifications peuvent désormais parvenir mais sont accumulées et NON traitées:
  la queue de traitement n'est ouverte qu'à la fin de la phase 0.
  */
  {
    const allSubs: Map<string, Subscription> = await idb.getSubscriptions()
    for(const [org, subscription] of allSubs) {
      dataSt.setSubscription(org, subscription)
      await subscription.subscribe(org, true)
    }
  }

  if (integral) {
    await idb.deleteAllDocs()
  } else {
    await idb.loadAllDocs()
  }
  
  // synchro immediate (sequentielle) de toutes les souscriptions
  await dataSt.syncAll()
  // Marquage de l'age de l'état de synchro de IDB
  await idb.putState('age', { lsd: j })

  // Fin de phase 1
  session.setPhase(1)
  // Les notifications reçues demandant des sync ne sont plus bloquées en queue
  dataSt.startSyncQueue() 
}