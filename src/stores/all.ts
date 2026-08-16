import { useConfigStore } from './config-store'
import { useUiStore } from './ui-store'
import { useSessionStore } from './session-store'
import { useSafeStore } from './safe-store'
import { useFormStore } from './form-store'

class Stores {
  configStore: any
  dataStore: any
  uiStore: any
  sessionStore: any
  safeStore: any
  formStore: any

  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }
  get session() { return this.sessionStore || (this.sessionStore = useSessionStore()) }
  get safe() { return this.safeStore || (this.safeStore = useSafeStore()) }
  get form() { return this.formStore || (this.formStore = useFormStore()) }
}
const stores = new Stores()
export default stores
