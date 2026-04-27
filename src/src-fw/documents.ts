import { DocRegistry, Document } from '../src-fw/docregistry'
import { Crypt } from '../src-fw/crypt'
import { keyToB64 } from '../src-fw/b64'
// import stores from '../stores/all'


/* Credential en Safe */
export class CredSafe {
  static lp1 = [ 'credId', 'svc', 'org', 'role', 'docId', 'privs', 'comment' ]

  credId: string = '' // ID du credential.
  svc: string = '' // code du service
  org: string = '' // le code de l'organisation.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  privs: string = '' // clé PRIVEE de signature en base64.
  comment: string = '' // texte court libre de l'utilisateur.
  recK: any = null // record libre (crypté par la clé K et en base64 en _safe_).
  
  constructor (obj?: Object) {
    if (obj)
      for (const p of CredSafe.lp1) this[p] = obj[p] || null
    if (!this.credId) this.credId = Crypt.rnd(15)
  }

  get $trole () : string { return 'ROLE' + this.role.replace('.', '_')}

  get toObj () : Object {
    const obj = {}
    for (const p of CredSafe.lp1) obj[p] = this[p] || null
    obj['credId'] = this.credId
    return obj
  }

  clone () : CredSafe { return new CredSafe(this.toObj) }

  get toJson () : string { return JSON.stringify(this.toObj, null, '\t') }

  setComment (s: string) { this.comment = s }

  static async buildCreds (
    svc: string,
    org: string,
    role: string,
    docId: string,
    comment: string,
    limit: number,
  ) : Promise<[CredSafe, Credential]> {
    const { pub, priv } = await Crypt.getSVKeyPair()
    const cs = new CredSafe({ svc, org, role, docId, privs: keyToB64(priv), comment })
    const c = Credential.fromCredSafe(cs, keyToB64(pub), limit)
    return [cs, c]
  }
}

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

  static fromCredSafe (cs: CredSafe, pubv: string, limit: number) : Credential {
    const c = new Credential()
    c.credId = cs.credId; c.role= cs.role; c.docId = cs.docId
    c.limit = limit; c.pubv = pubv; c.cond = {}
    return c
  }

  // implicit: svc org
  credId: string = '' // ID du credential.
  role: string = '' // docClass.role : un des codes de rôle connu du service.
  docId: string = '' // identifiant du document cible du credential.
  pubv: string = '' // clé PUBLIQUE de vérification (base64 sans bannière).
  limit: number = 0 // date-heure en seconde de fin de validité (0 si toujors valide)
  cond: any = null // Objet contenant les conditions d'application

}
DocRegistry.registerD(Credential)
