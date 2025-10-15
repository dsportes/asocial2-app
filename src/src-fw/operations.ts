import { Operation } from './operation'
import { sleep } from './util'
import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'
import { subscription } from'./document'

export class EchoText extends Operation {
  constructor () { super('EchoText') }

  async run (org: string, toecho: string) {
    try {
      await sleep(1000)
      const res = await this.post({ org, text: toecho })
      return res['echo']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class  GetSrvStatus extends Operation {
  constructor () { super('GetSrvStatus') }

  async run (org: string) {
    try {
      const res = await this.post({ org })
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetSrvStatus extends Operation {
  constructor () { super('SetSrvStatus') }

  async run (org: string, stx: number) {
    try {
      const config = stores.config
      const session = stores.session
      const authRecord = {
        sessionId : session.sessionId,
        time: Date.now(),
        tokens : [
          { type: 'ADMIN', value: config.K.ADMIN }
        ]
      }
      const args = { org, authRecord, st: stx, txt: 'info ' + stx}
      const res = await this.post(args)
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class TestAuth extends Operation {
  constructor () { super('TestAuth') }

  async run (org: string) {
    try {
      const config = stores.config
      const session = stores.session
      const authRecord = {
        sessionId : session.sessionId,
        time: Date.now(),
        tokens : [
          { type: 'ADMIN', value: config.K.ADMIN },
          { type: 'TEST1', toto: 'titi'},
          { type: 'TEST2', toto: 'titi'},
        ]
      }
      const res = await this.post({ authRecord })
      return res['auths']
    } catch(e) {
      this.ko(e)
    }
  }
}

/* SetSubscription enregistre la sousciption d'une session *************************
- Supprime la précédente s'il y en avait une
- Créé une nouvelle si l'argument subscription n'est pas null
*/
export class SetSubscription extends Operation {
  constructor () { super('TestAuth') }

  async run (org: string, defs: Object, longLife: boolean, title?: string, url?: string, ) {
    try {
      const session = stores.session
      const subJSON = session.subJSON
      const sessionId = session.sessionId
      const authRecord = {
        sessionId,
        time: Date.now(),
        tokens : [
        ]
      }
      const subscription: subscription = { 
        sessionId, subJSON, defs,
        url: url || '', 
        title: title || ''
      }
      const res = await this.post({ authRecord, org, subscription, longLife })
    } catch(e) {
      this.ko(e)
    }
  }
}

/* Sync : synchronise les abonnements cités *************************
- toSync = subsToSync[]
Retourne pour chaque 'def' les documents/rowQ nouveaux depuis t.
Si t est 0, retourne les documents sans filtre de version.
Retour: { def0: [data], def1: data, def2: [data[], pkv] ... }
- data: Uint8Array
- pkv: object donnant pour chaque pk sa version la plus récente ayant quitté la collection
*/
export class Sync extends Operation {
  constructor () { super('TestAuth') }

  async run (subsToSync: subsToSync) {
    try {
      const org = subsToSync.org
      const type = subsToSync.def.split('/').length - 1
      const dataSt = stores.data
      const session = stores.session
      const authRecord = {
        sessionId : session.sessionId,
        time: Date.now(),
        tokens : [
        ]
      }
      const res = await this.post({ authRecord, org, toSync: [subsToSync] })
      const x = res[subsToSync.def]
      switch (type) {
        case 0 : { dataSt.retSync0(subsToSync, x); break }
        case 1 : { dataSt.retSync1(subsToSync, x); break }
        case 3 : { dataSt.retSync2(subsToSync, x); break }
      }
      return res['auths']
    } catch(e) {
      this.ko(e)
    }
  }
}
