import { useConfigStore } from './config-store'
import { useDataStore } from './data-store'
import { useUiStore } from './ui-store'
import { useSessionStore } from './session-store'

class Stores {
  configStore: any
  dataStore: any
  uiStore: any
  sessionStore: any
  
  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get data() { return this.dataStore || (this.dataStore = useDataStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }
  get session() { return this.sessionStore || (this.sessionStore = useSessionStore()) }
}
const stores = new Stores()
export default stores