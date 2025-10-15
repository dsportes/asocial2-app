
import stores from '../stores/all'
import { IDB } from './idb'
import { subscription } from'./document'

type age = {
  lsd: number // jour (EPOCH) de dernière synchro aboutie
}

export const initSync = async (dbReset: boolean) => {
  // Acquisition des souscriptions et souscriptions
  const session = stores.session
  const dataSt = stores.data
  const config = stores.config

  if (dbReset)
    await IDB.delete(session.dbName)

  const idb = await IDB.open()

  const age = await idb.getState('age') as age
  const j = Math.floor(Date.now() / 86400000)
  const integral = !age.lsd || (j - age.lsd) > config.K.SYNCINCRNBD

  const allSubs: Map<string, subscription> = await idb.getSubscriptions()


  if (integral) {
    await idb.deleteAllDocs()
  } else {
    await idb.loadAllDocs()
  }
  
  // synchro immediate de toutes les souscriptions
  await dataSt.syncAll()
  // Marquage de l'age de l'état de synchro de IDB
  await idb.putState('age', { lsd: j })
  // Fin de phase 1
  session.setPhase(1)
  dataSt.startSyncQueue()
}