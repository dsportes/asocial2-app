import { Operation } from './operation'
import { sleep, config } from './util'

export class Echo extends Operation {
  constructor () { super('Echo') }

  async run (toecho: string) {
    await sleep(1000)
    const res = await this.post({ text: toecho })
    return res['echo']
  }
}

export class  GetSrvStatus extends Operation {
  constructor () { super('GetSrvStatus') }

  async run () {
    const res = await this.post({ })
    return res['srvStatus']
  }
}

export class SetSrvStatus extends Operation {
  constructor () { super('GetSrvStatus') }

  async run (stx: number) {
    const authRecord = {
      sessionId : config.sessionId,
      time: Date.now(),
      tokens : [
        { type: 'ADMIN', value: 'oKqMNBgdGotqrhdE9dChrJ8WY_b821OnauupPZiY5cg'},
      ]
    }
    const args = { authRecord, st: stx, txt: 'info ' + stx}
    const res = await this.post(args)
    return res['srvStatus']
  }
}

export class TestAuth extends Operation {
  constructor () { super('TestAuth') }

  async run () {
    const authRecord = {
      sessionId : config.sessionId,
      time: Date.now(),
      tokens : [
        { type: 'ADMIN', value: 'oKqMNBgdGotqrhdE9dChrJ8WY_b821OnauupPZiY5cg'},
        { type: 'TEST1', toto: 'titi'},
        { type: 'TEST2', toto: 'titi'},
      ]
    }
    const res = await this.post({ authRecord })
    return res['auths']
  }
}
