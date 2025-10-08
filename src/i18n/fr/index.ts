// This is just an example,
// so you can safely delete all default props below

export default {
  blabla: 'bla bla', // Test surcharge traductions
  blabla1: 'bla1 bla1', // Test surcharge traductions

  darkclear: 'Foncé / clair',

  titre: 'Test très simple - compteur: {0}',
  toecho: 'Texte à recevoir en écho',
  echo: 'Texte reçu en écho : {0}',
  ping: 'PING base de données',
  later: 'Plus tard',
  important: 'Information importante',
  gotit: 'J\'ai lu',
  clickhere: 'Cliquer ici',
  genhelp: 'Aide générale',
  theme: 'Théme graphique',
  pings: 'Server "pings"',
  buildapi: 'Build: {0} - API: {1}',
  closeApp: 'Fermer l\'application',
  restartApp: 'Redémmarrer l\'application',
  srvStatus_0: 'Statut du service inconnu',
  srvStatus_1: 'Statut du service UP (dernière mise à jour: {0})',
  srvStatus_2: 'Statut du service DOWN (dernière mise à jour: {0})',
  srvStatus: '{0} - {1} - {2}',
  readme: 'LISEZMOI',
  deplier: 'Déplier',
  replier: 'Replier',

  quitConfirm: 'Confirmer ...',
  quitQuit: 'Je confirme quitter l\'application',
  quitReload: 'Je confirme relancer l\'application',
  quitCont: 'Je continue ma session',

  MLAopc: 'Opération en cours',
  MLAint: 'Cliquer ici pour l\'interrompre',
  MLAcf: 'Voulez-vous vraiment interrompre l\'opération en cours "{0}"',
  MLAcf3: 'Non, je la laisse se poursuivre',
  MLAcf4: 'Oui, je veux l\'interrompre (si possible)',

  op_PingDB: 'PING de la base de données',
  op_EchoText: 'Echo du texte envoyé',
  op_TestMessage: 'Test de réception de push du serveur',
  op_RegisterSubscription: 'Enregistrement de web-push',
  op_TestAuth: 'Test d\'authentification',
  op_GetSrvStatus: 'Status du service',
  op_SetSrvStatus: 'Fixe le status du service',

  RLtit1: 'Nouvelle version disponible',
  RLtit2: 'L\'installation d\'une nouvelle session redémarre l\'application.',
  RLopt1: 'Première Option : en général efficace. ',
  RLopt2: 'Seconde option : fermer TOUS les onglets et fenêtres où s\'exécute l\'application puis l\'appeler à nouveau dans une nouvelle fenêtre / onglet.',

  THprimary: 'primary',
  THsecondary: 'secondary',
  THinfo: 'info',
  THaccent: 'accent',
  THpositive: 'positive : et hyperliens dans MD',
  THnegative: 'negative',
  THwarning: 'warning',
  THmsgbg: 'msgbg: background d\'un diagnotic',
  THmsgtc: 'msgtc: texte d\'un diagnotic',
  THtbptc: 'tbptc: texte d\'une toolbar primary',
  THtbstc: 'tbstc: texte d\'une toolbar secondary',
  THbtnbg: 'btnbg: background d\'un bouton normal',
  THbtntc: 'btnbg: texte d\'un bouton normal',
  THbtwbg: 'btwbg: background d\'un bouton warning',
  THbtwtc: 'btwtc: texte d\'un bouton warning',
  THmdtitre: 'mdtitre: texte des titres dans MD',

  PEtit: 'Le navigateur bloque les "notifications',
  PEinfo: 'L\'application ne peut pas fonctionner correctement si les notifications sont bloquées.',
  PEopt1: 'Vous devez modifier VOUS-MEME les autorisations du navigateur pour cette application (dans la barre d\'adresse).',
  PEopt2: 'Demander au navigateur d\'autoriser les notifications',

  moins1: 'Moins 1',
  plus1: 'Plus 1',
  pickfile: 'Choisir un fichier local',

  EX_1: 'Données saisies non conformes',
  EX_2: 'Données saisies non conformes',
  EX_3: '"BUG" probable: erreur inattendue récupérée par le serveur',
  EX_4: '"BUG" probable: erreur inattendue récupérée par le serveur',
  EX_5: '"BUG" probable: erreur inattendue récupérée par le serveur',
  EX_6: '"BUG" probable: erreur inattendue récupérée par le serveur',

  EX_10: 'Interruption volontaire (appui sur le bouton rouge)',
  EX_11: 'Erreur d`accès au serveur, réseau indisponible ?',
  EX_12: 'Erreur d\'accès à la base locale',
  EX_13: 'Erreur inattendue survenue dans le traitement sur l\'appareil',
  EX_14: 'Erreur inattendue survenue dans le traitement sur l\'appareil',

  EX_1001: 'Erreur "fake" pour test\n{0}',
  EX_3001: 'BUG probable: erreur inattendue\n{0}',
  EX_10000: 'Interruption volontaire',

  // 11000: Toutes erreurs de réseau
  EX_11001: 'Erreur inattendue du serveur. Status:{0} URL:{1}.\n{2}',
  EX_11002: 'Erreur inattendue d\'envoi au serveur, de réseau, ou de réception de la réponse. URL:{0}.\n{1}',
  EX_11003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  EX_11005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  EX_11006: 'Erreur de transfert du fichier vers l\'application locale de stockage de fichiers. Détail: {0}',

  // 12000: Toutes erreurs d'accès à la base locale
  EX_12001: 'Ouverture de la base locale impossible.\nDétail: {0}',
  EX_12002: 'Erreur d\'accès à la base locale impossible.\nDétail: {0}',

  // 13000:  Erreur inattendue trappée sur le browser
  EX_13000: 'Bug probable de l\'application.\nDétail: {0}',
  EX_13001: 'Retour de la requête mal formé : parse JSON en erreur. Opération: {0}\nDétail: {1}',
  EX_13002: 'Retour de la requête mal formé : désérialisation en erreur. Opération: {0}\nDétail: {1}',
  EX_13007: 'Echec d\'encryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX_13008: 'Echec de decryption. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX_13021: 'Bug probable de \'opération "{0}" après plusieurs tentatives aynat échoué.',
  EX_13022: 'Fichier impossible à décrypter: {0}',
  EX_13023: 'Echec de decryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',
  EX_13024: 'Echec d\'encryption RSA. Buffer: {0} - Clé: {1} - Détail: {2}',

  EX_quit: 'Quitter l\'application',
  EX_reload: 'Relancer l\'application',
  EX_continue: 'Poursuivre la session quand même',

  // DialogueHelp.vue
  HLPaidebd: 'Page "{0}" bientôt disponible',
  HLPfermer: 'Fermer l\'aide',
  HLPprec: 'Page d\'aide précédente',
  HLPfiltre: 'Filtre sur les titres',
  HLPdg: 'Site de documentation de l\'application',
  HLPmenu: 'Voir le détail dans le menu ci-dessus, rubrique _{0}_',
  HLPrm1: 'Note à propos de la révision de l\'application: quels sources ...',

  // Showdown
  SHed: 'Editer',
  SHpe: 'Plein écran',
  SHre: 'Réduire',

  // Pages d'aide
  A_boite_automaj: 'Mise à jour automatique des données d\'une session',
  A_dial_editeur: 'L\'éditeur des textes',
  A_DOCpg: 'L\'application "a-social"',
  A_pages: 'Pages de l\'application',
  A_pages_struct: 'Disposition générale d\'une page',
  A_panel_outils: 'Boîte à outils',
  A_top_bar: 'Barre du haut',
  A_dial: 'Dialogues ...'

}
