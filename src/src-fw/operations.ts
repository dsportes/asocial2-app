import { Operation } from './operation'
import { sleep } from './util'
import stores from '../stores/all'

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
