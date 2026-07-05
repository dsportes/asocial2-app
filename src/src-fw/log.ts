
export class AppExc {
  /* 
  codes: serveur
  1000: erreurs fonctionnelles FW
  2000: erreurs fonctionnelles APP
  3000: assertions FW
  4000: assertions APP
  5000: assertions FW - transmises à l'administrateur
  6000: assertions APP - transmises à l'administrateur

  codes: poste
  10000: 'Interruption volontaire',

  11000: Toutes erreurs de réseau
  11001: 'Erreur inattendue du serveur. Status:{0} URL:{1}.\n{2}',
  11002: 'Erreur inattendue d\'envoi au serveur, de réseau, ou de réception de la réponse. URL:{0}.\n{1}',
  11003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  11005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  11006: 'Erreur de transfert du fichier vers l\'application locale de stockage de fichiers. Détail: {0}',


  12000: Toutes erreurs d'accès à la base locale
  12001: 'Ouverture de la base locale impossible.\nDétail: {0}',
  12002: 'Erreur d\'accès à la base locale impossible.\nDétail: {0}',

  13000:  Erreur inattendue trappée sur le browser
  13000: 'Bug probable de l\'application.\nDétail: {0}',
  13001: 'Retour de la requête mal formé : parse JSON en erreur. Opération: {0}\nDétail: {1}',
  13002: 'Retour de la requête mal formé : désérialisation en erreur. Opération: {0}\nDétail: {1}',
  13007: 'Echec d\'encryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  13008: 'Echec de decryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  13021: 'Bug probable de \'opération "{0}" après plusieurs tentatives aynat échoué.',
  13022: 'Fichier impossible à décrypter: {0}',
  13023: 'Echec de decryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  13024: 'Echec d\'encryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',

  14000: assertion trappée par le browser

  Codes "major"
  EX_1: 'Données saisies non conformes',
  EX_2: 'Données saisies non conformes',
  EX_3: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_4: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_5: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',
  EX_6: '"BUG" très probable: erreur inattendue survenue dans le traitement sur le serveur',

  EX_10: 'Interruption volontaire (appui sur le bouton rouge)',
  EX_11: 'Erreur d`accès au serveur, réseau indisponible ?',
  EX_12: 'Erreur d\'accès à la base locale',
  EX_13: 'Erreur inattendue survenue dans le traitement sur l\'appareil',
  EX_14: 'Erreur inattendue survenue dans le traitement sur l\'appareil',
  */

  public code: number
  public label: string
  public opName: string
  public org: string
  public stack: string
  public args: string[]

  constructor (code: number, label: string, opName?: string, args?: string[], stack?: string) {
    this.code = code || 0
    this.label = label || ''
    this.opName = opName || ''
    this.args = args || []
    this.stack = stack || ''
    this.org = ''
  }

  get message () { return 'AppExc: ' + this.code + ':' + this.label +
    (this.opName ? '@' + this.opName + ':' : '') +
    JSON.stringify(this.args || []) }

  toString () { return this.message + (this.stack ? '\n' + this.stack : '')}

  static fromObj (obj: any) {
    const exc = new AppExc(obj.code, obj.label, obj.opName, obj.args, obj.stack)
    if (obj.org) exc.org = obj.org
    return exc
  }
}