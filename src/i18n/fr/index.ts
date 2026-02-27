// This is just an example,
// so you can safely delete all default props below

export default {
  lang: 'La langue est le Français',
  home: 'Accueil de l\'application {0}',
  darkclear: 'Foncé / clair',
  ok: 'OK',
  toecho_label: 'Texte à recevoir en écho',
  echo: 'Texte reçu en écho : {0}',
  later: 'Plus tard',
  important: 'Information importante',
  gotit: 'J\'ai lu',
  iconfirm: 'Je confirme',
  ireject: 'Je refuse',
  giveup: 'Je renonce',
  clickhere: 'Cliquer ici',
  genhelp: 'Aide générale',
  theme: 'Théme graphique',
  tech: 'Outils techniques',
  crypto: 'Cryptographie',
  cred: 'Credential',
  pings: 'Ping, etc.',
  service_label: 'Code su service',
  service_status: 'Status du service',
  org_status: 'Status organisation',
  url_label: 'URL du service',
  url_ph: 'https://srv1.monservice.com',
  url_set: 'Déclarer l\'URL du service',
  adminuser_label: 'Code de l\'utilisateur "Administrateur"',
  grant: 'Autoriser',
  revoke: 'Révoquer',
  service_url: 'URL du service: {0}',
  operator_label: 'Code opérateur',
  operator_ph: '$RED',
  app: 'Application:',
  build: 'Build',
  services: 'Services : URL [API]',
  sessionid: 'Session ID:',
  userid: 'Utilisateur ID:',
  unknown: '(inconnu)',
  username: 'Pseudo local:',
  authby: 'Authentifié par:',
  authby_0: '(pas encore authentifié)',
  authby_1: 'phrase secrète principale',
  authby_2: 'phrase secrète de secours',
  authby_3: 'code PIN',
  step: 'Étape:',
  step_0: 'Application en cours',
  step_1: 'Authentification de l\'utilisateur',
  step_2: 'Choix de la session à ouvrir',
  closeApp: 'Fermer l\'application',
  restartApp: 'Redémmarrer l\'application',
  svcStatus_now: 'Statut observé à: {0}',
  svcnocomment: '(pas de commentaires)',
  svcStatus_0: 'Status non connu',
  svcStatus_1: 'UP - dernière mise à jour: {0}',
  svcStatus_2: 'LECTURE - dernière mise à jour: {0}',
  svcStatus_9: 'DOWN - dernière mise à jour: {0}',
  svcStatus_maj: 'Mise à jour du status',
  svcStatus_label: 'Commentaire ...',
  svcStatus: 'Status des services',
  up: 'UP',
  down: 'DOWN',
  readme: 'LISEZMOI',
  deplier: 'Déplier',
  replier: 'Replier',
  org: 'Organisation',
  url: 'URL du serveur pour cette organisation: {0}',
  validate: 'Valider',
  nothing2confirm: 'Rien à confirmer', // BtnConfirm
  confirm: 'Pour confirmer taper {0}', // BtnConfirm
  edit: 'Editer',
  create: 'Nouveau',
  duplicate: 'Dupliquer',
  open: 'Ouvrir',
  restore: 'Rétablir',
  delete: 'Supprimer',
  reset: 'Réinitialiser',
  undo: 'Rétablir',
  st_0: 'inchangé',
  st_1: 'ajouté',
  st_2: 'modifié',
  st_3: 'supprimé',
  settings: 'Préférences',
  service: 'Service',
  endsession: 'Clore la session',
  servicestatus: 'Status des services',

  minmax: 'De {0} à {1} signes. ',
  tooshort: 'Texte trop court',
  toolong: 'Texte trop long',
  badform: 'Format non respecté',
  pressret: '"Entrée" pour valider',
  orgcode_label: 'Code organisation',
  orgcode_ph: 'monorg',
  aboutcred_label: 'A propos de ce droit d\'accès',

  exui: 'Erreur inattendue : {0} \r détail: {1}',

  quitConfirm: 'Confirmer ...',
  quitQuit: 'Je confirme quitter l\'application',
  quitReload: 'Je confirme relancer l\'application',
  quitCont: 'Je continue ma session',

  REGexp_b64: `Caractères autorisés:
  - lettres non accentuées minuscules \`a...z\` et majuscules \`A...Z\`
  - chiffres \`0...9\`
  - les caractères tiret haut \`-\` et tiret bas \`_\`
  - (ni espace ni 'Entrée'...)
  `,
  REGexp_num: `Caractères autorisés: chiffres \`0...9\`
  (ni espace ni 'Entrée'...)
  `,
  REGexp_an1: `Caractères autorisés:
  - lettres non accentuées minuscules \`a...z\`
  - chiffres \`0...9\`
  - les caractères tiret haut \`-\` et tiret bas \`_\`
  - (ni espace ni 'Entrée'...)
  `,
  REGexp_all: `Tous les caractères sont autorisés y compris les espaces
  `,

  ROLE: 'Rôle',
  ROLEadmin: 'Administrateur technique du service',
  ROLEmanager: 'Manager général de l\'organisation',
  ROLEauteur: 'Auteur d\'articles',
  ROLElecteur: 'Relecteur d\'articles',
  ROLEgroupe: 'Groupe de relecteurs',

  MLAopc: 'Opération en cours',
  MLAint: 'Cliquer ici pour l\'interrompre',
  MLAcf: 'Voulez-vous vraiment interrompre l\'opération en cours "{0}"',
  MLAcf3: 'Non, je la laisse se poursuivre',
  MLAcf4: 'Oui, je veux l\'interrompre (si possible)',

  PAGEhome: 'Connexion',
  PAGEadmin: 'Administration Technique',
  PAGEapp: 'Auteurs et relecteurs',
  PAGEtest: 'Page des tests',

  op_PingDB: 'PING de la base de données',
  op_EchoText: 'Echo du texte envoyé',
  op_$Hash: 'Test Hash PHP',
  op_$Verify: 'Test verify PHP',
  op_TestMessage: 'Test de réception de push du serveur',
  op_RegisterSubscription: 'Enregistrement de web-push',
  op_TestAuth: 'Test d\'authentification',
  op_GetSrvStatus: 'Status du service',
  op_SetSvcOpStatus: 'Fixe le status du service pour un opérateur',

  op_$Shas: 'Test shaS en PHP',
  op_$CreateSafe: 'Enregistrement d\'un nouvel utilisateur',
  op_$OpenSafeByPR: 'Ouverture du coffre fort de l\'utilisateur',
  op_$OpenSafeById: 'Ouverture du coffre fort de l\'utilisateur par son id',
  op_$OpenSafeByPin: 'Ouverture du coffre fort de l\'utilisateur par son code PIN',
  op_$SetAboutProfile: 'mise à jour / création d\'un profil',
  op_$UntrustDevices: 'Retrait de confiance aux terminaux',
  op_$TrustDevice: 'Ajout de confiance au terminal',
  op_$UpdateCreds: 'Mise à jours des droits d\'accès et sessions',
  op_$GetBinSafe: 'Backup d\'un coffre-fort',
  op_$GetPublicKeys: 'Obtention des clés publiques',
  op_$TransmitCred: 'Tramission d\'un droit d\'accès',
  op_$UpdCodesSafe: 'Mise à jour des codes d\'accès à un coffre fort',
  op_$RestoreSafe: 'Restauration d\'un "coffre fort"',
  op_GrantNewManager: 'Enregistre un utilisateur en tant que "manager".',
  op_RevokeManager: 'Réqvoque un utilisateur en tant que "manager".',
  op_ListManagers: 'Liste les droits attribués de "manager".',
  op_GetSvcOpStatus: 'Obtention du status du service / opérateur',
  op_GetSvcOrgStatus: 'Obtention du status d\'une organisation (pour un service / opérateur)',
  op_GrantSvcOpOrg: 'Autoiser le service d\'une organisation par un opérateur',
  op_RevokeSvcOpOrg: 'Révoquer le service d\'une organisation par un opérateur',

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

  APservices: 'Vous êtes "Administrateur Technique" du (des) [service / opérateur] : ',
  APnewOrg: 'Création d\'une nouvelle organisation',
  APdbcode_label: 'Code de config de la DB',
  APdbcode_ph: 'sqlite_a',
  APstcode_label: 'Code de config du Storage',
  APstcode_ph: 'storage_a',
  APcr_1: 'Organisation [{0}] créée.',
  APcr_0: 'Organisation [{0}] mise à jour.',
  APko: 'Echec de la création / mise à jour de l\'organisation [{0}].',
  APnewManager: 'Attribution du rôle "manager" à un utilisateur',
  APnouser: 'Utilisateur inconnu pour ce pseudo',
  APdiagorg: 'Le code de l\'organisation est incorrect ou manquant',
  APdiagtarget: 'Le pseudo de l\'utilisateur cible est incorrect ou manquant',
  APkomanager: 'Echec de l\'enregistrement d\'un nouveau "manager".',
  APokmanager: 'Succès de l\'enregistrement d\'un nouveau "manager".',

  PSpseudo: 'Mon pseudo, nom, email, mobile ... ',
  PSpseudo_label: 'Mon pseudo, nom, email, mobile ... ',
  PSpseudo_ph: 'Duke Ellington',
  PSphrase: 'Ma phrase secrète',
  PSphrase_label: 'Ma phrase secrète',
  PSphrase_ph: 'les 1 sanglots 2 longs 3 etc',
  /*
  PSphrase_bub: `Une bonne phrase secrète ... bla bla ...
  `,
  */
  PSdup: 'Nom déjà utilisé',
  PSpin: 'Code PIN',
  PSpin_label: 'Code PIN',
  PSpin_ph: 'PIN35-zx',
  PSdevname_label: 'Nom du terminal',
  PSdevname_ph: 'MonPC/bob/ff',
  PStrig: 'Initiales, trigramme ... :',
  PStrig_label: 'Initiales, trigramme ... :',
  PStrig_ph: 'Bob',
  PSsn: 'A propos de la session ... :',
  PSsnh: 'Accès à mon compte ...',

  SBphrase_label: 'Phrase secrète',
  SBphrase_ph: 'bla bla',
  SBphrase_sh: 'SH en base64:',
  SBphrase_sha: 'SHA du SH:',
  SBphrase_shaS: 'SHA "court" du SH:',
  SBgensv: 'Générer un couple de clés de signature / vérification',
  SBgensv2: 'Signature: PEM "private" - Vérification: PEM "public"',
  SBmanorg: 'Autoriser / révoquer une organisation pour ce service et cet opérateur',

  SBprivpem: 'Coller le PEM (private) de signature',
  SBgencred: 'Générer le credential',
  SBcredres: 'Credential normalisé et identifié',
  SBentid_label: 'ID de l\'entité (fac)',
  SBentkey_label: 'Clé AES (base 64) de l\'entité (fac)',
  SBhot: 'HOT!',
  SBhot_info: 'Ces actions requièrent d\'être enregistré comme Administrtaur du dépôt générique des "coffres forts".',
  SBnotauth: 'Ces actions requièrent d\'être authentifié',

  HPstore_label: 'Dépôt SPECIFIQUE du "coffre-fort"',
  HPstore_bub: `# Dépôt SPECIFIQUE du "coffre-fort"
  bla bla
  `,

  HPbackopen: `**Voulez-vous terminer cette session et retourner au choix d'une autre à ouvrir ?**

  OUI: _Je confirme_
  NON: _Je refuse_
`,
  HPchgcodes_1: 'Changement des codes d\'authentification',
  HPchgcodes_2: `### Changement des codes d'authentification
  bla bla
`,
  HPchgcodes_2d: `### Changement des codes d'authentification
Pour changer les codes d'authentification, par sécurité il faut s'être authentifié par sa phrase secrète (pas son code PIN).
`,
  HPtrust_1: 'Ce terminal N\'A PAS ma confiance, je veux la lui accorder',
  HPtrust_2: `### Accorder sa confiance au terminal
bla bla
`,
  HPtrust_2d: `### Accorder / retirer sa confiance à un terminal, changer son code PIN
Pour ces opérations, par sécurité il faut s'être authentifié par sa phrase secrète (pas son code PIN).
`,
  HPuntrust_1: 'Ce terminal a ma confiance, je veux la lui retirer',
  HPuntrust_2: `### Retirer sa confiance au terminal
bla bla
`,
  HPtrustings_1: 'Afficher / gérer mes terminaux de confiance',
  HPtrustings_2: `# Afficher / gérer mes terminaux de confiance
  bla bla
`,
  HPtrustings_l: 'Aucun terminal n\'est déclaré de confiance | ' +
  'Un terminal est déclaré de confiance | ' +
  '{count} terminaux sont déclarés de confiance',
  HPtrustings_del: 'Retirer la confiance en ces ({0}) terminaux',
  HPchgpin_1: 'Ce terminal a ma confiance, je veux changer son code PIN',
  HPchgpin_2: `### Changer son code PIN / modifier mon pseudo
bla bla
`,
  HPprefs_1: 'Afficher / gérer mes préférences',
  HPprefs_2: `# Afficher / gérer mes préférences
  bla bla
`,
  HPprefs_ed: 'Edition des options de préférence',
  HPprefsnosel: 'Aucune "préférence" sélectionnée.',
  HPprefssel: 'Préférence [{0}] : dernière édition {1} ({2}).',
  HPprefslist: 'Liste des "préférences" déclarées',
  HPprefraw: 'Texte brut (non éditable)',
  HPprefcode_label: 'Code de la "préférence"',
  HPprefcode_ph: 'Ecran large',
  HPprefdup: 'Ce code est déjà attribué à une "préférence", en saisir un libre.',
  HPauthentif: 'Authentification',
  HPnet_1: 'Accès à Internet',
  HPnet_2: 'Mode AVION: pas d\'accès à Internet',
  HPincognito_1: 'Accès aux données stockées sur ce terminal',
  HPincognito_2: 'Mode INCOGNITO: AUCUN accès aux données stockées sur ce terminal',
  HPterminal: 'Ce terminal a été nommé ',

  HPpstar: '(Défaut: tous droits d\'accès)',
  HPenreg_0: 'Enregistrement',
  HPenreg_1: 'Modification de mes codes d\'accès',
  HPenreg_2: 'Modification des codes d\'accès du "backup"',
  HPcode_1: 'Déclaration du code d\'accès principal',
  HPcode_2: 'Vérification du code d\'accès principal',
  HPcode_3: 'Déclaration du code d\'accès secondaire',
  HPcode_4: 'Vérification du code d\'accès secondaire',
  HPerr_1: 'Initiales / trigramme absent ou incorrect',
  HPerr_2: 'Code d\'accès principal absent ou invalide',
  HPerr_3: 'Code d\'accès principal: vérification échouée',
  HPerr_4: 'Code d\'accès secondaire absent ou invalide',
  HPerr_5: 'Code d\'accès secondaire: vérification échouée',
  HPtrig: 'Pseudo, nom ... : {0}',
  HPps: 'Phrase secrète : {0}',
  // HPca: 'Code d\'accès principal',
  // HPcr: 'Code d\'accès secondaire',
  HPcsret_00: 'Enregistrement effectué avec succès.',
  HPcsret_01: 'Echec de l\'enregistrement: changer le "pseudo du code d\'accès principal".',
  HPcsret_02: 'Echec de l\'enregistrement: changer le "pseudo du code d\'accès secondaire".',
  HPcsret_09: 'BUG - Echec de l\'enregistrement, l\'utilisateur a déjà été créé.',
  HPcsret_10: 'Mise à jour des codes d\'accès effectuée avec succès.',
  HPcsret_11: 'Echec de la mise à jour des codes d\'accès: l\'utilisateur n\'est pas enregistré.',
  HPcsret_12: 'Echec de la mise à jour des codes d\'accès: changer le "pseudo du code d\'accès principal".',
  HPcsret_13: 'Echec de la mise à jour des codes d\'accès: changer le "pseudo du code d\'accès secondaire".',
  HPcsret_19: 'Echec de la mise à jour des codes d\'accès: l\'utilisateur n\'est pas enregistré.',
  HPopsret_0: 'Authentification réussie.',
  HPopsret_1: 'Authentification en échec: code d\'accès invalide.',
  HPopsret_2: 'Authentification en échec: code d\'accès invalide.',
  HPopsret_3: 'Authentification en échec: code d\'accès invalide.',
  HPcsret_20: 'Importation effectuée avec succès.',
  HPcsret_21: 'Echec de l\'importation: changer le "pseudo du code d\'accès principal".',
  HPcsret_22: 'Echec de l\'importation: changer le "pseudo du code d\'accès secondaire".',
  HPcsret_9: '"Coffre fort définitivement supprimé',

  /*
  HPauthby_0: 'Utilisateur anonyme',
  HPauthby_1: '{0} [principal]',
  HPauthby_2: '{0} [secondaire]',
  HPauthby_3: '{0} [PIN]',
  HPauthby_9: 'Phase d\'authentification',
  */

  HPopnotpin_0: 'Succès de l\'opération.',
  HPopnotpin_1: 'Echecs de l\'opération: utilisateur non authentifié.',
  HPopnotpin_2: 'Echecs de l\'opération: l\'utilisateur doit être authentifié par phrase secrète (pas par code PIN).',

  HPsfop_0: 'Succès de l\'opération.',
  HPsfop_1: 'Echec de l\'opération: utilisateur non enregistré.',
  HPsfop_2: 'Echec de l\'opération: utilisateur non authentifié.',
  HPsfop_9: 'Echec de l\'opération: incident technique inattendu.',

  HPsetdev: 'Donner un nom court à ce terminal',
  HPchgdev: 'Changer le nom court de ce terminal s\'il ne vous convient pas',
  HPsetPIN: 'Saisir un code PIN d\'accès',
  HPsetPseudo: 'Saisir un pseudo local pas déjà utilisé',
  HPsttrust_0: 'Terminal déclaré de confiance.',
  HPsttrust_1: 'Echec de la déclaration de confiance: utilisateur non enregistré.',
  HPsttrust_2: 'Echec de la déclaration de confiance: codes de l\'utilisateur incorrects.',
  HPstuntrust_0: 'Confiance retiré au terminal.',
  HPstuntrust_1: 'Echec du retrait de confiance: utilisateur non enregistré.',
  HPstuntrust_2: 'Echec du retrait de confiance: codes de l\'utilisateur incorrects.',
  HPbypin_1: 'Ouverture par code PIN en échec: le terminal n\'est pas déclaré "de confiance".',
  HPbypin_2: 'Ouverture par code PIN en échec: utilisateur non enregistré.',
  HPbypin_3: 'Ouverture par code PIN en échec: le terminal n\'est pas enregistré "de confiance".',
  HPbypin_4: 'Ouverture par code PIN en échec: CODE PIN INCORRECT, le corriger et réessayer.',
  HPbypin_5: 'Ouverture par code PIN en échec: nombre de tentatives supérieur à 2, désormais le TERMINAL N\'EST PLUS RECONNU "DE CONFIANCE".',
  HPutd_1: 'Pour information: quand ce terminal n\'est pas déclaré "de confiance", la ou les sessions qui y avaient été "épinglées" ne le sont plus (elles n\'ont plus de données sauvegardées localement):',
  HPutd_2: '- leurs réouverture sont PLUS LONGUES,',
  HPutd_3: '- elles NE SONT PLUS ACCESSIBLES EN MODE AVION.',
  HPutnbs: 'Aucune session initiée sur ce terminal. | Une session est initiée sur ce terminal. | {count} sessions sont initiées sur ce terminal.',
  HPutc1: 'Application',
  HPutc2: 'A propos de la session ...',
  HPsize_1: 'Volumes libérables',
  HPsize_2: 'A supprimer',

  /*
  HPupc_1: 'Utilisateur',
  HPupc_2: 'Application',
  HPupc_3: 'Volume',
  HPupc_4: 'Dernière connexion ici',
  */
  HPskull_0: '{0} sessions(s) et {1} utilisateur(s) seront supprimé(s)',
  HPskull_1: 'Leurs données enregistrées localement seront supprimées. Les sessions "épinglées" ' +
    'seront désépinglées et non accessibles en mode AVION. Ce terminal ne sera plus "de confiance" pour les utilisateurs supprimés.',

  HPskull: 'TOUTES les données enregistrées localement seront supprimées. Toutes les sessions "épinglées" ' +
    'seront désépinglées et non accessibles en mode AVION. Ce terminal ne sera plus "de confiance" pour personne.',
  HP3ps: 'Phrase secrète vous identifiant sur ce terminal',
  HPclicksession: 'Cliquer sur la session à ouvrir / rouvrir.',
  HPnoclick: 'Aucune session sélectionnée',
  HPskull_9: 'Votre "coffre fort" va être irrémédiablement supprimé. Avez-vous effectué un "backup" par précaution ?',
  HPskull_8: 'Renoncer ou confirmer.',

  HPresetdb_0: 'Effacer le cache local des documents et fichiers de l\'exécution précédente',
  HPresetdb_1: `### Attention !
La base locale sera effacée ce qui provoquera le rechargement _intégral_ de ses données.

- Ceci peut alonger **significativement** la durée d'initialisation de la session.
- Les fichiers attachés aux documents conservés sur ce terminal ne seront plus accessibles en mode avion.
`,
  HPunpin_0: 'DÉSÉPINGLER cette session: supprime son cache local de documents et fichiers',
  HPunpin_1: `# Désépingler une session
- économise de la place sur le terminal en supprimant ses données stockées localement.
- ralentit sa réouverture ultérieure sur ce terminal.
- interdt son ouverture en mode AVION sur ce terminal.
`,
  HPpin_0: 'ÉPINGLER cette session: active son cache local de documents et fichiers',
  HPpin_1: `# Épingler une session
- occupe de la place sur le terminal en stockant certaines de ses données localement.
- accélère sa réouverture ultérieure sur ce terminal.
- autorise son ouverture en mode AVION sur ce terminal.
`,
  HPwprfs: 'Ouvrir cette session avec les préférences de présentation ...',
  HPpref_1: '... par défaut',
  HPnotpinned: '(non épinglée)',
  HPexpname_label: 'Nom du fichier de backup',
  HPexpsafe_1: 'Faire un backup de son "coffre-fort"',
  HPexpsafe_2: `# Faire un backup de son "coffre-fort"
bla bla
`,
  HPdelsafe_1: 'Suppression irrémédiable de mon "coffre fort"',
  HPdelsafe_2: `# Suppression irrémédiable de mon "coffre fort"
bla bla
`,
  HPdelsafe_3: `# Suppression irrémédiable de mon "coffre fort"
Auth forte requise bla bla
`,

  HPmanuser: 'Utilisateurs',
  HPdanger: 'DANGER',
  HPimpsafe_1: 'Importer le backup d\'un "coffre-fort"',
  HPimpsafe_2: `# Importer le backup d\'un "coffre-fort"
bla bla
`,
  HPimpsafe_3: 'Fichier importé et décrypté : vérification du propriétaire',
  HPimpsafe_4: 'Vous n\'êtes pas authentifié comme propriétaire (pseudo ou phrase incorrecte)',

  HPsafest_1: 'Un "coffre-fort" est déjà enregistré pour cet utilisateur. Vous êtes sur le point de le remplacer.',
  HPsafest_r: 'Restaurer le "backup" en remplacement de l\'actuel',
  HPsafest_i: 'Importer le "backup"',
  HPsafest_2gt: 'Il est PLUS récent [{0}] que celui du backup [{1}].',
  HPsafest_2lt: 'Il est MOINS récent [{0}] que celui du backup [{1}].',
  HPsafest_2eq: 'Il est de la même date [{0}] que celui du backup.',
  HPsafest_3: 'Aucun "coffre-fort" n\'est actuellement enregistré pour cet utilisateur.',
  HPsafest_4a: 'Le backup PEUT être restauré en remplaçant l\'actuel.',
  HPsafest_4b: 'Le backup PEUT être importé.',
  HPsafest_5p: 'Le pseudo "principal" est déjà celui d\'un autre utilisateur.',
  HPsafest_5r: 'Le pseudo "secondaire" est déjà celui d\'un autre utilisateur.',
  HPsafest_5a: 'Le backup NE PEUT PAS remplacer l\'actuel.',
  HPsafest_5b: 'Le backup NE PEUT PAS être importé.',
  HPsafest_6: 'Je veux changer les codes d\'accès contenus dans le "backup"',
  HPsafest_7: `# Changer les codes d\'accès contenus dans le "backup"
  bla bla
`,

  HPmanusers: 'Gérer les utilisateurs et leurs sessions',
  HPmanu_1: 'Vous disposez du login du terminal, vous pouvez nettoyer les ' +
   ' "utilisateurs" obsolètes (et leurs sessions) à votre convenance',
  HPregist_1: 'Je suis ENREGISTRÉ ...',
  HPregist_2: `# Être ENREGISTRÉ ...
c'est disposer d'un **coffre-fort** centralisé, sécurisé et crypté spécifiquement pour soi où sont mémorisées des informations _critiques_.

### Une liste de _droits d'accès_
Chacun est consitué d'éléments cryptographiques complexes autorisant l'exécution de certaines opérations et d'accès à certaines données.

### Une liste de _sessions nommées_
Chacune reprend quelques uns des droits d'accès ci-dessus et pertinents pour la rouvrir dans les mêmes conditions.

### Des jeux de **préférences d'adffichage**
On peut choisir par confort d'appliquer un jeu ou un autre selon la session à ouvrir et le terminal sur lequel on l'ouvre.

### Une liste de _terminaux de confiance_
On peut y rouvrir une session avec un code PIN simple.
Ouvrir une session en **mode AVION** (sans accès à Internet) n'est possible que depuis un terminal déclaré _de confiance_.
`,
  HPregist_3: 'Je NE suis PAS ENREGISTRÉ mais je le fais',
  HPregist_4: `# Je ne peux pas m'enregistrer ...
Il n'y a pas de réseau et l'enregistrement requiert d'accéder au serveur qui gère les _coffres forts_ des utilisateurs.
`,
  HPregist_5: 'Ouverture en mode CALCULETTE',
  HPregist_6: `# Ouverture en mode CALCULETTE
bla bla
`,
  HPauthbypin_1a: 'Je suis l\'utilisateur [{0}] confiant dans ce terminal',
  HPauthbypin_1b: 'Je suis un des {0} utilisateurs confiants dans ce terminal...',
  HPauthstrong_1: 'Authentification "forte"',
  HPsaisirpin: 'Saisir votre code PIN',
  HPmanuinfo: `# Gérer les utilisateurs ...
Suppression sélective des utilisateurs et de leurs sessions.
`,
  HPmode_1: `# Ouvrir une session AVEC ou SANS Internet ...
C'est le mode _normal_: les documents et fichiers de la base centrale sont accédés en respectant les _droits d'accès_ de la session ouverte.

# Ouvrir une session SANS Internet ...
Deux possibilités:

### (1) Rouvrir en **mode AVION** une session qui a été _ÉPINGLÉE_
Quand une session a été _épinglée_ sur ce terminal, elle dispose d'un **cache** local crypté de documents et de fichiers.
La rouvrir en mode _AVION_ lui donne accès en lecture à ceux-ci, dans l'état où ils étaient à la fin de la dernière session ouverte avec Internet accessible.

### (2) Mode _CALCULETTE_
Sans accès Internet ni accès à aucun document ni fichier des bases centrales l'application travaille en mode _calculette_: les fonctionnalités proposées sont en conséquence en général très restreintes (mais celà dépend de l'application).
`,
  HPmode_2: `# Ouvrir une session en accédant aux données stockées localement ...
C'est le mode _normal et optimal_.

Les utilisateurs ayant déclaré ce terminal **de CONFIANCE**,
- _peuvent_ s'authentifier par un simple code PIN,
- _peuvent_ **ÉPINGLER** leurs sessions ce qui accélère leur rouverture et permet d'y accéder en **mode AVION**.

# Ouvrir une session INCOGNITO ...
En **mode INCOGNITO**, l'application n'accède, _ni en lecture ni en écriture_, à aucune donnée stockée localement sur le terminal considéré comme absolument non digne de confiance.

### (1) Si l'utilisateur a **ÉPINGLÉ** préalablement certaines de ses sessions
Il peut les rouvrir et accéder aux documents et fichiers selon les _droits d'accès_ attachés à cette session.
- il peut ouvrir aussi des sessions _vierges de tous droits_ et les acquérir en cours de session en fonction de ses besoins.

### (2) Sinon l'application peut être ouverte en **Mode _CALCULETTE_**
Sans avoir connaissance d'aucun document ni fichier de l'application, les fonctionnalités proposées sont en général très restreintes (celà dépend de l'application).
`,
  HPmode_3: `# Ouvrir une session SANS Internet et INCOGNITO ...
En **mode INCOGNITO**, l'application n'accède, _ni en lecture ni en écriture_, à aucune donnée stockée localement sur le terminal considéré comme absolument non digne de confiance.

Les sessions sont ouvertes en **Mode _CALCULETTE_**, sans avoir connaissance d'aucun document ni fichier de l'application.
Les fonctionnalités proposées peuvent être très restreintes (celà dépend de l'application).
`,
  HPauthbypin_2: `# Authentification par code PIN
Si vous avez déclaré ce terminal **de confiance**, vous _pouvez_ vous authentifier en donnant simplement votre code PIN.

Cliquer sur le pseudo de la liste correspondant aux initiales que vous avez donné lors de la déclaration de confiance.
S'il n'y est pas, c'est que la confiance a été retiré à ce terminal.

> La seconde saisie consécutive erronnée d'un code PIN retire la confiance dans ce terminal.

> Vous _pouvez_ aussi utiliser l'authentification **forte**. Si vous avez l'intention de gérer ensuite la confiance dans ce terminal ou de changer vos codes d'authentification forte, c'est même requis.
`,
  HPauthstrong_2: `# Authentification "forte"
bla bla
`,
  HPcredsmgr_1: 'Voir / gérer les droits d\'accès',
  HPcredsmgr_2: `# Gérer les droits d'accès
bla bla
`,
  HPcredslst_1: 'Liste des droits d\'accès enregistrés',
  HPcredslst_2: `# Liste des droits d'accès enregistrés
A propos du status ...
`,
  HPcredsdet_1: 'Détail du droit d\'accès',
  HPcredsdet_2: `# Détail d'un droit d'accès enregistré
A propos du status ...
`,
  HPcredno: 'Aucun droit d\'accès sélectionné dans la liste',
  HPpsno: 'Aucune session sélectionnée dans la liste',
  HPcreddet_0: 'Service: [{0}] - Organisation:[{1}] - Rôle: {2}',
  HPcredac_1: 'Le droit d\'accès est dans la liste d\'origine (n\'a pas été importé): l\'en RETIRER',
  HPcredac_2: 'Le droit d\'accès a été retiré de la liste: l\'y REMETTRE',
  HPcredac_3: 'Le droit d\'accès n\'était PAS dans la liste et vient d\'être "importé": l\'y SUPPRIMER',
  HPcreddis: 'Contenu technique',
  HPlisted: 'Cité dans les sessions',
  HPlisted_C: 'Droits d\'accès cités dans la session',
  HPlisted_O: 'Droits d\'accès cités dans la session MAIS n\'existant pas dans la liste des droits. Cliquer sur ceux à retirer de la session.',
  HPnotlisted: 'NON cité dans les sessions',
  HPnotlisted_C: 'Droits d\'accès NON cités dans la session',
  HPimport_0: 'Importer',
  HPexport_0: 'Exporter',
  HPbackup_0: 'Backup',
  HPimport_1: 'Importer des droits d\'accès',
  HPexport_1: 'Exporter des droits d\'accès',
  HPexportsafe_ko: 'Le coffre-fort n\'a pas être obtenu. Etes-vous bien authentifié et connecté à Internet ?',
  HPimport_clear: 'Depuis un fichier JSON en clair',
  HPimport_crypt: 'Depuis un fichier JSON crypté',
  HPimport_txt: 'Depuis un texte JSON saisi',
  HPexport_clear: 'Dans un fichier JSON en clair',
  HPexport_crypt: 'Dans un fichier JSON crypté',
  HPimport_label: 'Clé de cryptage du fichier',
  HPimport_ph: 'mon secret',
  HPimport_bf0: 'Clé de cryptage non saisie ou incorrecte',
  HPimport_bf1: 'Fichier illisible.',
  HPimport_bf2: 'Clé de cryptage incorrecte ? Fichier illisible.',
  HPexport_bf2: 'Clé de cryptage incorrecte ? Echec d\'encryption.',
  HPimport_bf3: 'Fichier mal formé, ne contient pas des droits d\'accès.',
  HPimport_disp: 'Voir le texte brut',
  HPimport_unck: 'Décocher les droits d\'accès à ne pas importer, puis "Valider" pour importer.',
  HPexport_unck: 'Décocher les droits d\'accès à ne pas exporter, puis "Valider" pour exporter.',
  HPimport_inp: 'Saisir le texte JSON',
  HPexport_ok: 'Fichier sauvegardé dans le répertoire de _Téléchargements_ sous le nom [`{0}`].',
  HPcrab: 'A propos du droit d\'accès ...',
  HPcrab_label: 'A propos du droit d\'accès ...',
  HPcrab_ph: 'mon droit à ...',
  // HPpsab: 'A propos de la session ...',
  HPpsab_label: 'A propos de la session ...',
  HPpsab_ph: 'ma session pour ...',
  HPtab_c: 'Droits d\'accès',
  HPtab_s: 'Sessions',
  HPpslst_1: 'Liste des sessions',
  HPpslst_2: `# Liste des sessions
bla bla
`,
  HPnewps_0: 'Nouvelle session ...',
  HPnewps_1: 'AVEC tous les droits d\'accès',
  HPnewps_2: 'SANS AUCUN droit d\'accès',
  HPnewps_3: 'AVEC les droits d\'accès de la session courante',
  HPcfgPS: 'Ajouter / configuer des sessions et des droits d\'accès',
  HPcfupd: 'Rapport des mises à jour des droits',
  HPstcr_1: 'Droits d\'accès ajoutés : {0}',
  HPstcr_2: 'Droits d\'accès supprimés : {0}',
  HPstcr_3: 'Droits d\'accès mis à jour (à propos) : {0}',
  HPps_1: 'Sessions créées: {0}',
  HPps_2: 'Sessions supprimées: {0}',
  HPps_3: 'Sessions mises à jour (à propos) : {0}',
  HPps_4: 'Sessions mises à jour (droits d\'accès changés) : {0}',
  HPps_5: 'Sessions sans droits d\'accès : {0}',
  HPps_6: 'Sessions référençant des droits d\'accès inconnus : {0}',
  HPnothing: 'Aucun changement à valider',
  HPtransmit_test: 'TEST de transmission d\'un droit d\'accès',
  HPtransmit_label: 'Cible de la transmission (TEST)',
  HPexpinfo: 'Information',
  HPexpexport: 'Export',
  HPexppub: 'Clés publiques',
  HPexporgid: 'ID localisée pour une organisation',
  HPusersN: 'Utilisateur(s) sans sessions épinglées:',
  HPusersY: 'Utilisateur(s) ayant des sessions épinglées:',

  // util dhcool
  DHCaujah: 'aujourd\'hui à {0}',
  DHCauja: 'aujourd\'hui',
  DHChierah: 'hier à {0}',
  DHChiera: 'hier',
  DHCleah: 'le {0} à {1}',
  DHClea: 'le {0}',
  DHCjah: '{0} à {1}',
  DHCja: '{0}',
  DHCnondate: '(non daté)',
  DHCdansjours: 'aujourd\'hui | demain | dans {count} jours',

  // FormCred
  FCentid_label: 'ID de l\'entité cible',
  FCentid_bub: `# ID de l\'entité cible
bla bla
`,
  FChpems_label: 'Hash court du PEM de signature',
  FChpems_bub: `# Hash court du PEM de signature
bla bla
`,
  FCpemv_label: 'PEM de vérification',
  FCpemv_bub: `# PEM de vérification
bla bla
`,
  FCdtime_label: 'Date-Heure UTC de fin de validité',
  FCdtime_bub: `# Date-Heure UTC de fin de validité
bla bla
`,
  FCinfou_label: 'Texte informatif pour l\'utilisateur cible',
  FCinfou_bub: `# Texte informatif pour l\'utilisateur cible
bla bla
`,
  FCinfos_label: 'Texte informatif pour le déclarant',
  FCinfos_bub: `# Texte informatif pour le déclarant
bla bla
`,
  FCtarget_label: 'Pseudo de l\'utilisateur cible',
  FCtarget_bub: `# Pseudo de l\'utilisateur cible
bla bla
`,
  FCmissing: 'Le champ [{0}] ne doit pas être vide',
  FCroleko: 'Le champ "rôle" n\'a pas une valeur reconnue',
  FCdtimeko: 'Le champ "dtime" est mal formé, date-heure non reconnue',

  EX_0: '"BUG" probable: erreur inattendue récupérée par le terminal',
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
  EX_1002: 'Opération inconnue [{0}]',
  EX_1003: 'Opération [{0}] - organisation inconnue [{1}]',
  EX_1004: 'Opération [{0}] - service inconnu [{1}]',
  EX_1005: 'Droit d\'accès NON validé - organisation [{0}] - role [{1}] - entid [{2}] ]',
  EX_1006: 'Jeton d\'accès expiré sur opération pour l\'organisation [{0}] - Tenter de la relancer.',
  EX_1007: 'Le service [{0}] n\'est pas assuré par l\'opérateur [{1}]. Erreur de saisie (ou BUG improbable)',
  EX_1008: 'L\'organisation [{0}] n\'a pas d\'opérateur assurant le service [{1}]. Erreur de saisie (ou BUG improbable)',
  EX_1009: 'Le service [{1}] n\'est pas géré par l\'application. Erreur de saisie (ou BUG improbable)',

  EX_2001: 'BUG probable: opération sans cible organisation ou opérateur.',
  EX_2002: 'Vous n\'êtes pas enregistré en tant qu\'Administrateur du dépôt générique des "coffres forts"',
  EX_2003: 'Signature "hors délai" dans la vérification que vous êtes enregistré en tant qu\'Administrateur du dépôt générique des "coffres forts"',
  EX_2004: 'Pour le service [{0}], l\'organisation [{2}] n\'est pas hébergée par l\'opérateur [{1}]. Erreur de saisie (ou BUG improbable)',

  EX_3001: 'BUG probable: erreur inattendue\n{0}',
  EX_3002: 'BUG probable: droit d\'accès [{0} / {1} / {2}] requis pour cette opération et non transmis par l\'application.',
  EX_10000: 'Interruption volontaire',

  // 11000: Toutes erreurs de réseau
  EX_11001: 'Erreur inattendue du serveur. Status:{0} URL:{1}.\n{2}',
  EX_11002: 'Erreur inattendue d\'envoi au serveur, de réseau, ou de réception de la réponse. URL:{0}.\n{1}',
  EX_11003: 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  EX_11005: 'Erreur de transfert du fichier vers le serveur de fichier. Détail: {0}',
  EX_11006: 'Erreur de transfert du fichier vers l\'application locale de stockage de fichiers. Détail: {0}',
  EX_11007: 'Aucun serveur ne prend en charge l\'organisation "{0}".\nDétail: {1}',

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

  moins1: 'Moins 1',
  plus1: 'Plus 1',
  pickfile: 'Choisir un fichier local',
  blabla: 'bla bla', // Test surcharge traductions
  blabla1: 'bla1 bla1', // Test surcharge traductions
  titre: 'Test très simple - compteur: {0}'
}
