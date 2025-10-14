
import stores from '../stores/all'
import { IDB } from './idb'

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

  await idb.getDefs(integral)
  /* les souscriptions sont en data-store:
  leur version détenue en local a été mise à 0 si "integral"
  la syncQueue est remplie: elle n'est pas started (phase 0) */

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