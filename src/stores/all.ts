import { useConfigStore } from './config-store'
import { useDataStore } from './data-store'
import { useUiStore } from './ui-store'

class Stores {
  configStore: any
  dataStore: any
  uiStore: any
  
  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get data() { return this.dataStore || (this.dataStore = useDataStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }
}
const stores = new Stores()
export default stores