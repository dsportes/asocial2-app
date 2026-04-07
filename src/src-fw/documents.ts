import { Document } from '../src-fw/document'
import { CredSafe } from './credsafe'
// import stores from '../stores/all'

/* Document Credential stocké en DB du service/org
Rapprochement avec Cred par: svc org userId role docId (l'ID)
- à condition que le time soit le même. Sinon le credential est "brisé" (inutilisable).
- dans ce cas pems (Cred) / pemv (Credential) sont issus de la même génération du couple.
Schéma du document;
  - pk: ['userId', 'role', 'docId']
  - index: userId
*/
export class Credential extends Document {
  async compile () {}

  static lp1 = [ 'role', 'docId', 'time' ]
  static fromCredSafe (cs: CredSafe, userId: string, pemv: string, limit: number) : Credential {
    const c = new Credential()
    c.id = cs.id; c.role= cs.role; c.time = cs.time
    c.userId = userId; c.pemv = pemv; c.limit = limit
    return c
  }

  // implicit: svc org

  id: string = '' // ID du credential.
  userId: string = '' // utilisateur détenteur
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  time: number = 0 // epoch en seconde de génération

  pemv: string = '' // clé PUBLIQUE de vérification (base64 sans bannière).
  limit: number = 0 // date-heure en seconde de fin de validité (0 si toujors valide)
  cond: any = null // Objet contenant les conditions d'application

}
