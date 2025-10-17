
import stores from '../stores/all'
import { IDB } from './idb'
import { Subscription } from'./document'
import { SetSubscription } from './operations'
import { modes } from '../stores/session-store'

type age = {
  lsd: number // jour (EPOCH) de dernière synchro aboutie
}

export const sessionPhase0 = async (
  mode: modes, dbReset: boolean, dbName: string, context: Object ) => {
  
  // Acquisition des souscriptions et documents
  const session = stores.session
  const dataSt = stores.data
  const config = stores.config

  session.setMode(mode)
  if (session.hasIDB)
    session.setDbName(dbName)
  
  if (session.mode === modes.SYNC && dbReset)
    await IDB.delete(session.dbName)

  let idb = session.hasIDB ? await IDB.open() : null
  let integral = true
  const jourj = Math.floor(Date.now() / 86400000)

  if (session.mode === modes.SYNC) {
    const age = await idb.getState('age') as age
    integral = !age.lsd || (jourj - age.lsd) > config.K.SYNCINCRNBD
  }

  // Inscription en data-store des defs de toutes les sousciptions
  if (session.mode !== modes.PLANE) {
    const morg = await idb.getSubs()
    for(const [org, mclazz] of morg) {
      for(const [clazz, subs] of mclazz)
        dataSt.initDefs(org, clazz, subs)
    }
  }

  /* Enregistrement en store (et abonnement au serveur) 
  des souscriptions de "session active".
  Des notifications peuvent désormais parvenir mais sont accumulées et NON traitées:
  la queue de traitement n'est ouverte qu'à la fin de la phase 0.
  */
  if (session.mode !== modes.PLANE) {
    const allSubs: Map<string, Subscription> = await idb.getSubscriptions()
    for(const [org, subscription] of allSubs) {
      dataSt.setSubscription(org, subscription)
      await subscription.subscribe(org, true) // Redéfinition possible de title / url
    }
  }

  if (session.mode === modes.SYNC && integral)
    await idb.deleteAllDocs()
  if (session.hasIDB && !integral)
    await idb.loadAllDocs((org: string, doc: Document) => {
      dataSt.setDoc(org, doc)
    })
  
  // synchro immediate (sequentielle) de toutes les souscriptions
  if (session.hasNet)
    await dataSt.syncAll()
  // Marquage de l'age de l'état de synchro de IDB
  if (session.mode === modes.SYNC)
    await idb.putState('age', { lsd: jourj })

  // Fin de phase 1
  session.setPhase(1)

  // Les notifications reçues demandant des sync ne sont plus bloquées en queue
  if (session.hasNet)
    dataSt.startSyncQueue() 
}