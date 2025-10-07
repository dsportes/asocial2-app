import { useConfigStore } from './config-store'
import { useDataStore } from './data-store'

class Stores {
  configStore: any
  dataStore: any
  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get data() { return this.dataStore || (this.dataStore = useDataStore()) }
}
const stores = new Stores()
export default stores