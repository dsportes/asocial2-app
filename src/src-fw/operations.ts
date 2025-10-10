import { Operation } from './operation'
import { sleep } from './util'
import stores from '../stores/all'
import { subsToSync } from '../stores/data-store'

export class EchoText extends Operation {
  constructor () { super('EchoText') }

  async run (toecho: string) {
    try {
      await sleep(1000)
      const res = await this.post({ text: toecho })
      return res['echo']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class  GetSrvStatus extends Operation {
  constructor () { super('GetSrvStatus') }

  async run () {
    try {
      const res = await this.post({ })
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class SetSrvStatus extends Operation {
  constructor () { super('SetSrvStatus') }

  async run (stx: number) {
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
      const args = { authRecord, st: stx, txt: 'info ' + stx}
      const res = await this.post(args)
      return res['srvStatus']
    } catch(e) {
      this.ko(e)
    }
  }
}

export class TestAuth extends Operation {
  constructor () { super('TestAuth') }

  async run () {
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
        case 0 : {
          dataSt.retSync0(subsToSync, x)
          break
        }
        case 1 : {
          dataSt.retSync1(subsToSync, x)
          break
        }
        case 3 : {
          dataSt.retSync2(subsToSync, x[0], x[1])
          break
        }
      }
      return res['auths']
    } catch(e) {
      this.ko(e)
    }
  }
}
