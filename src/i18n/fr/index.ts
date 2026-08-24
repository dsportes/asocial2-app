// This is just an example
// so you can safely delete all default props below

export default {
  app_label: 'Auteurs et relecteurs',

  service: 'Service',
  service_label: 'Code su service',
  services_AS2: 'Auteurs et relecteurs',
  services_ASSO2: 'Gestion des associations',
  services_SAFE: 'Gestion des Safe Boxes',

  site: 'Site',
  org: 'Organisation',

  lang: 'La langue est le Français',
  darkclear: 'Foncé / clair',
  ok: 'OK',
  me: 'moi',
  planemode: 'Mode Avion',
  pseudolocal: 'Pseudo sur ce poste:',
  userid: 'ID utilisateur:',
  guest: 'Invité',
  login: 'Login',
  later: 'Plus tard',
  important: 'Information importante',
  gotit: 'J\'ai lu',
  iconfirm: 'Je confirme',
  ireject: 'Je refuse',
  giveup: 'Je renonce',
  erase: 'Effacer',
  clickhere: 'Cliquer ici',
  genhelp: 'Aide générale',
  theme: 'Théme graphique',
  tech: 'Outils techniques',
  crypto: 'Cryptographie',
  status: 'Status',
  url_set: 'Déclarer l\'URL du service',
  grant: 'Autoriser',
  revoke: 'Révoquer',
  declare: 'Déclarer',
  app: 'Application:',
  build: 'Build',
  alias: 'Alias',
  closeApp: 'Fermer / Redémmarrer l\'application',
  restartApp: 'Redémmarrer l\'application',
  nocomment: '(pas de commentaire)',
  svcorg: 'Service & Organisation',
  sites: 'Sites',
  orgs: 'Organisations',
  nosvcorg: 'Ce service ne gère pas cette organisation.',

  servicestatus: 'Status des services',
  orgStatus: 'Status de l\'organisation [{0}] pour le service "{1}" (site: [{2}]).',
  svcStatus_label: 'Commentaire ...',
  svcStatus_now: 'Status observé à: {0}',
  svcStatus_0: '(inconnu)',
  svcStatus_1: 'UP - dernière mise à jour: {0}',
  svcStatus_2: 'LECTURE - dernière mise à jour: {0}',
  svcStatus_9: 'DOWN - dernière mise à jour: {0}',
  site_err: 'Ce site ne peut pas être atteint: c\'est soit un incident technique passager, soit une erreur de configuration.',
  site_ok: 'Site accessible: {0}',
  svcStatus_maj: 'Mise à jour du status',

  svcStatus_no: 'Service / opérateur non sélectionné',
  svcStatus_no2: 'Service non sélectionné',
  svcStatus_no3: 'Vous n\'êtes "manager" d\'aucune organisation.',
  svcStatus_no4: 'Vous êtes "manager" des organisations ci-dessous. ' +
    'Cliquer sur le bouton "corbeille" d\'un pouvoir pour LE REVOQUER.',
  up: 'UP',
  down: 'DOWN',
  url_label: 'URL du service',
  url_ph: 'https://srv1.monservice.com',
  readonly: 'LECTURE SEULE',
  readme: 'LISEZMOI',
  deplier: 'Déplier',
  replier: 'Replier',
  validate: 'Valider',
  confirm: 'Pour confirmer, taper', // BtnConfirm
  containing: 'contenant abc ',
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
  endsession: 'Clore la session',
  record: 'Enregistrer',
  recorded: 'Enregistrement effectué avec succès.',
  ltime: 'Valide jusqu\'à',
  noprint: 'Texte non affichable',
  minmax: 'De {0} à {1} signes. ',
  tooshort: 'Texte trop court',
  toolong: 'Texte trop long',
  badform: 'Format non respecté',
  pressret: '"Entrée" pour valider',
  operator_label: 'Code de l\'opérateur',
  orgcode_label: 'Code organisation',
  orgcode_ph: 'monorg',
  aboutcred_label: 'A propos de ce pouvoir',

  exui: 'Erreur inattendue : {0} \r détail: {1}',

  quitConfirm: 'Confirmer ...',
  quitQuit: 'Je confirme quitter l\'application',
  quitReload: 'Je confirme relancer l\'application',
  quitCont: 'Je continue ma session',
  closeCf: 'Saisies en cours, confirmer ...',
  closeCf_label: `### Des saisies sont en cours ...
  - Si vous confirmez, elles seront perdues.
  - Si vous renoncez, vous pourrez continuer votre travail normalement.
  `,
  closeCf_1s: 'Je confirme fermer ma session',
  closeCf_2s: 'Je renonce, ma session se poursuit',
  closeCf_1d: 'Je confirme fermer ce dialogue',
  closeCf_2d: 'Je renonce, le dialogue se poursuit',
  backopen: 'Fin de session ?',
  backopen_label: `### Confirmation de clôture de cette session.
- en cas de confirmation la session sera fermée et la page de "login" s'affichera.
- sinon ce dialogue s'effacera et la session se poursuivra normalement.
`,

  ORG_label: 'Code organisation',
  ORG_ph: 'monorg',

  // ChoixEmoji
  EMOsearch1: 'Recherche',
  EMOnotfound: 'rien trouvé',
  EMOsearch2: 'Résultat de recherche',
  EMOrecent: 'Récents',
  EMOsmileys: 'Smileys / Emotions',
  EMOpeople: 'People & Corps',
  EMOnature: 'Animaux / Nature',
  EMOfoods: 'Nourriture / Boisson',
  EMOactivity: 'Activitée',
  EMOplaces: 'Voyages',
  EMOobjects: 'Objets',
  EMOsymbols: 'Symboles',
  EMOflags: 'Drapeaux',
  EMOcustom: 'Custom',

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

  MLAopc: 'Opération en cours',
  MLAint: 'Cliquer ici pour l\'interrompre',
  MLAcf: 'Voulez-vous vraiment interrompre l\'opération en cours "{0}"',
  MLAcf_3: 'Non, je la laisse se poursuivre',
  MLAcf_4: 'Oui, je veux l\'interrompre (si possible)',

  PAGEp1: 'Page TEST #1',
  PAGEp2: 'Page TEST #2',
  PAGEhome: 'Connexion',
  PAGEadmin: 'Administration Technique',
  PAGEapp: 'Auteurs et relecteurs',
  PAGEdemands: 'Mes demandes / propositions reçues',
  PAGEdemands_label: 'Mes demandes, création et suivi',
  PAGEdemands_bub: `### Mes demandes, création et suivi des propositions reçues:
  - faire une nouvelle demande d\'invitation: solliciter des tiers pour que l\'un d'entre eux fasse une proposition.
  - lister mes procédures _en cours_:
    - mes demandes n'ayant pas encore été prises en compte par un tiers,
    - les propositions faites par tiers, soit suite à une de mes demandes, soit de leur propre inititiative.

  `,
  PAGEsponsorings: 'Demandes des autres, suivi',
  PAGEsponsorings_label: 'Mes propositions aux demandes des autres, création et suivi',
  PAGEsponsorings_bub: `### Mes propositions aux demandes des autres, création et suivi
  - répondre à une demande d'un utilisateur en faisant une proposition selon mes pouvoirs.
  - prendre l'initiative d'une proposition à un utilisateur avant qu'il l'ai sollicitée forellement.
  - suivre les procédures ouvertes et le cas échant y intervenir.

  `,
  PAGEauteur: 'Auteurs',
  PAGEauteur_label: 'Mes interventions en tant "qu\'auteur"',
  PAGEauteur_bub: `### Mes interventions en tant **qu'auteur**
  - quels sont les _auteurs_ pour lesquels j'ai un pouvoir,
  - mes _chats_ avec mes _co-auteurs_,
  - liste des auteurs par section de rédaction,

  `,

  PAGEtest: 'Page des tests',

  PanelManager: 'Management des organisations',

  op_PingDB: 'PING de la base de données',
  op_EchoText: 'Echo du texte envoyé',
  op_$Hash: 'Test Hash PHP',
  op_$Verify: 'Test verify PHP',
  op_TestMessage: 'Test de réception de push du serveur',
  op_RegisterSubscription: 'Enregistrement de web-push',
  op_TestAuth: 'Test d\'authentification',
  op_GetSrvStatus: 'Status du service',
  op_SetSvcOpStatus: 'Fixe le status du service pour un opérateur',

  // op_$Shas: 'Test shaS en PHP',
  op_$CreateSafe: 'Enregistrement d\'un nouvel utilisateur',
  op_$OpenSafeByPR: 'Ouverture de la Safe Box de l\'utilisateur',
  op_$OpenSafeById: 'Ouverture de la Safe Box de l\'utilisateur par son id',
  op_$OpenSafeByPin: 'Ouverture de la Safe Box de l\'utilisateur par son code PIN',
  op_$SetAboutProfile: 'Mise à jour / création d\'un profil',
  op_$UntrustDevices: 'Retrait de confiance aux terminaux',
  op_$TrustDevice: 'Ajout de confiance au terminal',
  op_$UpdateCreds: 'Mise à jour des pouvoirs',
  op_$GetBinSafe: 'Backup d\'une Safe Box',
  op_$GetUserCVO: 'Obtention des clés publiques et du safe store d\'un utilisateur',
  op_$UpdCodesSafe: 'Mise à jour des phrases secrètes d\'ouverture de votre Safe Box',
  op_GrantNewManager: 'Enregistre un utilisateur en tant que "manager".',
  op_RevokeManager: 'Réqvoque un utilisateur en tant que "manager".',
  op_ListManagers: 'Liste les pouvoirs attribués de "manager".',
  op_ADMIN$getStatus: 'Lecture du status du site',
  op_ADMIN$setStatus: 'Mise à jour du status du site',
  op_FW$getStatus: 'Mise à jour du status du service / opérateur',
  op_FW$setStatus: 'Mise à jour du status d\'une organisation (pour un service / opérateur)',
  op_GrantSvcOpOrg: 'Autoiser le service d\'une organisation par un opérateur',
  op_RevokeSvcOpOrg: 'Révoquer le service d\'une organisation par un opérateur',
  op_SetAdmins: 'Déclarer les service / opérateur dont l\'utilisateur est Administrateur',
  op_ADMIN$isAdmin: 'Test si l\'utilisateur est Administrateur',
  op_$SetAdmins: 'Enregistre la liste des service/opérateur dont l\'utilisateur est Administrateur.',
  op_GetOrgConfig: 'Récupération de la configuration d\'une organisation',
  op_SetOrgConfig: 'Enregistrement de la configuration d\'une organisation',
  op_InvitCreate: 'Création d\'une demande d\'invitation',
  op_InvitList: 'Liste des invitations',
  op_InvitGet: 'Lecture d\'une invitation par son ID par son propriétaire',
  op_InvitAR: 'Acceptation ou rejet d\'une invitation',
  op_InvitValidate: 'Validation d\'une invitation',
  op_InvitDC: 'Annulation ou refus d\'une invitation',
  op_RevokeCred: 'Révocation d\'un pouvoir',
  op_ListUserCreds: 'Liste des credentials de l\'utilisateur',
  op_$GrantSvcOpOrg: 'Autoriser / révoquer un service pour une organisation',
  op_$SetUserICVO: 'Enregistrement du compte dans le Master Directory.',
  op_$SetOpUrl: 'Enregistrement de l\'URL d\'un service.',
  op_$mdUserNew: 'Enregistrement d\'un nouveau safe.',
  op_$GetSafe: 'Ouverture d\'une Safe Box.',
  op_CaseGet: 'Lecture d\'un cas',
  op_CaseCreateByS: 'Création d\'une invitation par un sponsor',
  op_CaseCreateByU: 'Création d\'une invitation par l\'utilisateur',
  op_CaseUpdByS: 'Mise à jour d\'une invitation par un sponsor',
  op_CaseUpdByU: 'Mise à jour d\'une invitation par l\'utilisateur',
  op_CaseCancel: 'Suppression d\'une invitation par l\'utilisateur',
  op_$mdInvitSet: 'Mise à jour d\'une invitation dans le Master Directory',
  op_$CreateCred: 'Création d\'un credential',
  op_GetCred: 'Obtention du détail d\'un credential',
  op_$UpdateCredComment: 'Mise à jour du commentaire d\'un pouvoir',
  op_$mdUserGetICVS: 'Obtention de la localisation de la Safe Box',
  op_$UpdatePrefs: 'Mise à jour des préférences',
  op_$mdEventList: 'Lecture de mes demandes / propositions',
  op_FormFilteredList: 'Lecture des demandes / propositions concernant les "autres"',
  op_FormUpdByT: 'Mise à jour d\'une proposition',
  op_FormUpdByU: 'Mise à jour d\'une demande',
  op_FormGet: 'Lecture d\`une demande / proposition',
  op_FormValidateByU: 'Mise à jour d\'une demande / proposition par l\'utilisateur cible',
  op_FormValidateByT: 'Mise à jour d\'une demande / proposition par l\'utilisateur tiers',
  op_$UpdateProfiles: 'Mise à jour des listes de pouvoirs.',
  op_GetCredProps: 'Lecture des propriétés d\'un pouvoir',
  op_AutidDeNom: 'Recherche d\'un auteur par son nom',
  op_PropsOfMyCreds: 'Lecture des propriétés de mes pouvoirs',
  op_AuteurDeId: 'Lecture d\'un "auteur"',
  op_UpdPropsCred: 'Mise à jour des propriétés d\'un pouvoir',
  op_$IsMDAdmin: 'Test si l\'utilisateur est administrateur du Master Directory',
  op_$GetSitesUrls: 'Récupération des URLs des sites.',
  op_$SetSiteUrl: 'Mise à jour d\'une URL d\'un site.',
  op_$GetServicesLabels: 'Récupération de la liste des services.',
  op_$SetServicesLabels: 'Enrregistrement de la liste des services.',
  op_$SetOrgSvcSite: 'Enregistrement d\'un service pour une organisation.',
  op_$GetOrgSvc: 'Lecture des services assurés pour une organisation.',
  op_$mdAliasFree: 'Vérification de la disponibilité de l\'alias choisi.',
  op_FormCreateByU: 'Création d\'une demande.',
  op_FormCreateByT: 'Création d\'une proposition.',
  op_$mdEventNew: 'Création d\'un événement.',
  op_$mdEventSync: 'Mise à jour d\'un événement.',
  op_FormCancel: 'Annulation d\'une demande.',
  op_$mdEventUser: 'Lecture d\'un événement',
  op_CONFIG$CKey: 'Lecture d\'une clé de configuration',
  op_CONFIG$Services: 'Lecture des services assurés par le site',
  op_FW$setSubscription: 'Souscription aux notifications',
  op_MajAuteur: 'Mise à jour d\'un nom d\'auteur',
  op_$UpdateCredName: 'Mise à jour d\'un nom de crdential',
  op_FW$Sync: 'Synchonisation des données',
  op_$PingStore: 'Test d\'accès à un store de Safe Box',
  
  /* Status de retour d'une opération sur Safe / Master Directory */
  STSF_1: 'Aucune Safe Box n\'est enregistrée avec cet alias',
  STSF_2: 'Preuve de propriété de la Safe Box non reconnue (phrase ou autre).',
  STSF_3: 'Phrase secrète non reconnue.',
  STSF_4: 'Terminal non identifié, n\'ayant pas fait l\'objet d\'une certification.',
  STSF_5: 'Trop d\'essais d\'un code PIN erroné. La certification du terminal a été supprimée.',
  STSF_6: 'Code PIN non reconnu. Deux échecs son tolérés avant suppression de la certification du terminal.',
  STSF_7: 'Invitation inconnue, status non modifiable.',
  STSF_8: 'Terminal non authentifié comme certifié.',
  STSF_9: 'Authentification du terminal impossible. Se connecter par alias / phrase et certifier à nouveau le terminal.',
  STSF_11: 'Alias 1 identifie déjà une autre Safe Box.',
  STSF_12: 'Alias 2 identifie déjà une autre Safe Box.',
  STSF_13: 'Safe Box déjà créée mais avec un contenu différent (BUG ?)',

  STFO_1: 'Demande / proposition déjà créée. (BUG probable).',
  STFO_2: 'Tentative de création d\'une demande en votre nom par un autre utilisateur. (BUG probable).',
  STFO_98: 'Incident lors de l\'inscription d\'un pouvoir en Safe Box: l\'opération a échoué',
  STFO_99: 'Incident lors de la création d\'un pouvoir: l\'opération a échoué',

  STCR_1: 'Le pouvoir présenté pour cette opération n\'est pas acceptable. (BUG ?)',
  STCR_2: 'Le pouvoir présenté pour cette opération porte sur un document disparu. (BUG ?)',
  STCR_3: 'Le pouvoir présenté pour cette opération porte sur un document dont les propriétés ne peuvent pas être mises à jour par l\'utilisateur. (BUG ?)',


  RLtit1: 'Nouvelle version disponible',
  RLtit2: 'L\'installation d\'une nouvelle session redémarre l\'application.',
  RLopt1: 'Première Option : en général efficace. ',
  RLopt2: 'Seconde option : fermer TOUS les onglets et fenêtres où s\'exécute l\'application puis l\'appeler à nouveau dans une nouvelle fenêtre / onglet.',

  PSpin: 'Code PIN',
  PSpin_label: 'Code PIN',
  PSpin_ph: 'PIN35-zx',
  PSdevname_label: 'Nom du terminal',
  PSdevname_ph: 'MonPC/bob/ff',
  PStrig: 'Initiales, trigramme ... :',
  PStrig_label: 'Initiales, trigramme ... :',
  PStrig_ph: 'Bob',

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

  /* UAP : SafeCr */
  UAPtit_u: 'Création de votre Safe Box',
  UAPtit_a: 'Changement des alias de votre Safe Box',
  UAPtit_p: 'Changement des phrase d\'ouverture de votre Safe Box',

  UAPok_u: 'Vous êtes déclaré comme utilisateur, votre "Safe Box" a été créée.',

  UAPquit_txt: 'Des saisies ont été effectuées. Voulez-vous fermer quand-même et les perdre ou reprendre la procédure?',
  UAPquit_1: 'Fermer ce dialogue',
  UAPquit_0: 'Poursuivre la procédure',
  UAPdiag_0: 'OK',
  UAPdiag_1: 'Au moins un alias est requis.',
  UAPdiag_2: 'Deux alias au plus peuvent être déclarés.',
  UAPdiag_3: 'Au moins une phrase secrète est requise.',
  UAPdiag_4: 'Deux phrases secrètes au plus peuvent être déclarées.',
  UAPdiag_5: 'Aucun changement à valider',
  UAPdiag_6: 'Un alias est requis pour importer la Safe Box.',

  UAPl_a: 'Aucun alias déclaré | Alias déclaré | Alias déclarés',
  UAPl_p: 'Aucune phrase déclarée | Phrase déclarée | Phrases déclarées',

  UAPa_a: 'Ajouter un alias',
  UAPa_p: 'Ajouter une phrase secrète',
  UAPs_a: 'Saisie d\'un alias',
  UAPv_a: 'Vérification de l\'alias',
  UAPs_p: 'Saisie d\'une phrase secrète',
  UAPv_p: 'Vérification de la phrase',
  UAPm1_a: 'C\'est déjà l\'alias d\'un autre utilisateur.',
  UAPm3_a: 'Vérification échouée. Re-saisir la vérification ou la saisie initiale.',
  UAPc_a: 'Je corrige ma saisie initiale',
  UAPt_a: 'Je renonce à ajouter un alias',
  UAPt_p: 'Je renonce à ajouter une phrase secrète',
  UAPdup_a: 'Cet alias est déjà dans votre liste',
  UAPdup_p: 'Cet phrase est déjà dans votre liste',
  UAPdup_p1: 'Cette phrase était une des vôtres',
  UAPok_a: 'Alias changé(s).',
  UAPok_p: 'Phrases changée(s).',
  UAPko_a: 'Incident technique au cours de la procédure: les alias ont pu être changés OU NON. Retenter l\'opération et si l\'incident persiste la situation sera éclaicie à la prochaine ouverture de la Safe Box.',

  Alias_label: 'Mon alias: pseudo, email, mobile ... ',
  Alias_bub: `### Un alias peut être par exemple ...
  - mon prénom / nom,
  - un pseudo de mon choix,
  - une adresse e-mail,
  - un numéro de mobile,
  - etc.

  Sur 8 à 24 signes, sans autre contrainte.
  L'alias ne s'affiche que ...
  - quand vous en saisissez un,
  - quand c'est l'un des vôtres.

  L'alias n'est jamais utilisé pour une qulconque relation avec le monde réel.
  Rien n'empêche un utilisateur de mentionner à titre d'alias une donnée d'identification d'une personne réelle ... ce qui ne dit rien sur le fait qu'il soit ou non cette personne.
  `,
  Alias_ph: 'Duke Ellington',

  Phrase_label: 'Ma phrase très secrète',
  Phrase_bub: `### Une phrase très secrète est ...
  - a au moins 24 signes,
  - évite de répéter les mêmes,
  - reste mnémotechnique POUR VOUS,
  - évite les "classiques" comme 'abcd...".

  Une fois ces règles respectées elle est incassable par force brute (essais itératifs systématiques).
  `,
  Phrase_ph: 'Les1sanglots2Longs3du4Printemps',

  LCRnew: 'Nouvelle liste',
  LCRtit_btn: 'Gérer mes "listes de pouvoirs"',
  LCRtit_label: 'Gérer mes "listes de pouvoirs"',
  LCRtit_bub: `### Gérer mes "listes de pouvoirs"
Une **liste de pouvoirs**,
- porte un nom (court) de votre choix explicitant l\'usage que vous en faites,
- est une simple liste de certains de vos pouvoirs.

La liste (virtuelle) **Générale** est définie par défaut et contient à tout instant tous vos pouvoirs (elle ne peut pas être modifiée),

Quant une session de l'application s'ouvre, elle référence toujours une liste de pouvoirs (le cas échéant _tous_):
- elle se déroulera comme si vous n'aviez QUE ces pouvoirs,
- de ce fait elle concentre la session sur un sujet d'intérêt précis: par exemple un _magasin_ (une organisation), un _employé_ ...

`,
  LCRbtnnew: 'Nouvelle liste avec les pouvoirs...',
  LCRbtnnew_e: 'Aucun',
  LCRbtnnew_f: 'Tous',
  LCRnosel: 'Sélectionner une liste existante ci-dessus, ou créer une nouvelle liste.',
  LCRonlylc: 'Ne voir QUE les pouvoirs référencés dans la liste',
  LCRonlycr: 'Ne voir QUE les listes référençant ce pouvoir',
  LCRtab_l: 'Mes listes',
  LCRtab_c: 'Pouvoir courant',
  LCRdupname: 'Nom déjà attribué à une autre liste ({0}).',
  LCRok: 'Mises à jour des "listes de pouvoirs" enregistrées.',
  LCRcredcl_tit: 'Mises à jour non validées',
  LCRcredcl_txt: `### Des mises à jour n'ont pas été validées:
- Si vous confirmez vouloir quitter cette page, elles seont perdues.
- Si vous restez sur cette page, vous pouvez poursuivre et valider vos mises à jour.

`,
  LCRcredcl_0: 'Je reste sur cette page',
  LCRcredcl_1: 'Je quitte cette page',

  APsites: 'Liste des sites gérés et leur URL',
  APnosites: 'Aucun site n\'est géré actuellement.',
  APsiteadmin: 'Administrateur du site',
  APsinfo: 'Site [{0}] - URL: [{1}]',
  
  APnomanagers: 'Aucun "manager" trouvé.',
  APnc: '(inconnu)',
  APsvclabels: 'Liste des services',
  APjsonerr: 'Erreur de syntaxe JSON: [{0}]',
  APnewsite: 'Créer un nouveau site',
  APsite_label: "Code du site",
  APurl_label: "URL du site",
  APsetstsite: 'Changement du status',
  APdeclorg: 'Déclaration des organisations',
  APchorg: 'Choisir une organisation:',
  APnewsvcorg: 'Nouveau service:',
  APneworg: 'Nouvelle organisation: {0}',
  APcfdelsite_tit: 'Suppression d\'un site',
  APcfdelsite_txt: `Voulez-vous vraiment supprimer ce site ? 
- Si non, cliquer sur "JE RENONCE"'
- Si oui, cliquer sur "JE CONFIRME ..."
`,
  APcfdelsite_1: 'Je confirme la suppression',
  APcfdelsite_0: 'Je renonce',

  APcfupda_tit: 'Suppression d\'un service',
  APcfupda_txt: `Voulez-vous vraiment supprimer le service [{1}] pour [{0}] ? 
- Si non, cliquer sur "JE RENONCE"'
- Si oui, cliquer sur "JE CONFIRME ..."
`,
  APcfupda_1: 'Je confirme la suppression',
  APcfupda_0: 'Je renonce',
  APcfupdb_tit: 'Mise à jour d\'un service',
  APcfupdb_txt: `Voulez-vous vraiment changer la prise en charge du service [{1}] pour [{0}], la retirer du site [{2}] pour la confier au site [{3}] ?
- Si non, cliquer sur "JE RENONCE"'
- Si oui, cliquer sur "JE CONFIRME ..."
`,
  APcfupdb_1: 'Je confirme le changement',
  APcfupdb_0: 'Je renonce',
  APcfupdc_tit: 'Suppression d\'un dernier service',
  APcfupdc_txt: `Voulez-vous vraiment supprimer le dernier service [{1}] supporté pour [{0}] ?
- Ceci revient à rendre **invalider de facto** l'organisation. 
- Si non, cliquer sur "JE RENONCE"'
- Si oui, cliquer sur "JE CONFIRME ..."
`,
  APcfupdc_1: 'Je confirme la suppression',
  APcfupdc_0: 'Je renonce',
  APnoadm: 'Cette fonctionnalité est requiert d\'avoir un pouvoir d\'administration pour cette organisation / service.',
  APlstmanagers: 'Liste des attributions de pouvoirs de nature "manager".',

  APservices: 'Vous êtes "Administrateur Technique" de ... ',
  APnewManager_2: 'Rôles "manager"',
  APnouser: 'Utilisateur inconnu pour ce pseudo',
  APnouser2: 'Ce pseudo n\'est pas l\'un des vôtres',
  APrevok: 'Révocation effectuée',
  APrevko: 'La révocation semble avoir déjà été faite',
  APgrantmgr: 'Déclarer',
  APorgconfig: 'Configurer',
  APoc_svc: 'Service',
  APoc_op: 'Opérateur',
  APoc_org: 'Organisation',
  APoc_db: 'Database',
  APoc_st: 'Storage',
  APoc_dbs: 'Databases',
  APoc_sts: 'Storages',
  APoc_nch: 'Configuation non modifiée',
  APoc_cfg: 'Mettre à jour la configuration',
  APoc_del: 'SUPPRIMER la configuration',
  APnolimit: '(illimité)',
  APdeclmgr: 'Déclaration d\'un nouveau "manager"',
  APtab: 'Information à destination de cet utilisateur:',
  APlstmgr: 'Rafraîchir la liste des managers',
  APrevcfa_txt: `### Révoquer mon rôle de "manager" de cette organisation ...
M'empêchera de répondre aux demandes de création, d'invitation, de _sponsoring_ ...
Si je suis le dernier **manager**, la vie de l'organisation peut en être gravement perturbée.
`,
  APrevcfa_tit: 'Révoquer mon rôle de "manager" ?',
  APrevcfa_0: 'Je renonce me révoquer',
  APrevcfa_1: 'Je confirme ma révocation',
  APrevcf_txt: `### Révoquer le rôle de "manager" à cet utilisateur
L'empêchera de répondre aux demandes de création, d'invitation, de _sponsoring_ ...
Si c'est le dernier **manager**, la vie de l'organisation peut en être gravement perturbée.
`,
  APrevcf_tit: 'Révoquer ce rôle "manager" ?',
  APrevcf_0: 'Je renonce à la révocation',
  APrevcf_1: 'Je confirme la révocation',
  APtarget_label: 'A propos de l\'utilisateur cible',
  APtarget_bub: `# A propos de l\'utilisateur cible
bla bla
`,
  APdelcred: 'Supprimer ce pouvoir',
  APvallimit: 'Limite de validité:',
  APnovallimit: 'Pas de limite de validité.',
  APundolimit: 'Rétablir',
  APaddlimit: 'Ajouter',
  APdellimit: 'Supprimer',
  APlimitpast: 'La date et l\'heure sont dans le passé, ce qui équivaut à une suppression du pouvoir.',
  APupdok: 'Le pouvoir a été mis à jour.',
  APdelok: 'Le pouvoir a été supprimé.',
  APupdko: 'Echec de mise à pouvoir qui n\'a pas été trouvé.', 
  APlistmgr: 'Mise à jour du pouvoir',

  SButtitle: 'Profil utilisateur',
  SBphrase_label: 'Phrase secrète',
  SBphrase_ph: 'bla bla',
  SBphrase_sh: 'SH en base64:',
  SBphrase_sha: 'SHA du SH:',
  SBphrase_shaS: 'SHA "court" du SH:',
  SBgenuserid: 'Générer un identiant d\'utilisateur',
  SBgencc: 'Générer un couple de clés de ...',
  SBgensv: 'Signature / Vérification',
  SBgendc: 'Décryptage / Cryptage',
  SBgen_1: 'Signature: PEM "private" - Vérification: PEM "public"',
  SBgen_2: 'Décryptage: PEM "private" - Cryptage: PEM "public"',
  SBmanorg: 'Autoriser / révoquer une organisation pour ce service et cet opérateur',
  SBhot: 'HOT!',
  SBhot_info: 'Ces actions requièrent d\'être enregistré comme Administrtaur du "MASTERDIR".',
  SBnotauth: 'Ces actions requièrent d\'être authentifié',

  HPstartpref: 'Préférences ...',

  HPtrust_1: 'Ce terminal N\'EST PAS certifié, le certifier',
  HPtrust_2: `### Certifier ce terminal
bla bla
`,
  HPuntrust_1: 'Retirer la certification de ce terminal [{0}]',
  HPuntrust_2: `### Retirer sa confiance au terminal
bla bla
`,
  HPtrustings_1: 'Afficher / gérer mes terminaux de confiance',
  HPtrustings_2: `# Afficher / gérer mes terminaux de confiance
  bla bla
`,
  HPtrustings_l: 'Aucun terminal n\'est certifié | ' +
  'Un terminal est certifié | ' +
  '{count} terminaux sont certifiés',
  HPtrustings_del: 'Retirer la confiance en ces ({0}) terminaux',
  HPchgpin_1: 'Terminal certifié, changer son code PIN / pseudo',
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

  HPterminal: 'Ce terminal a été nommé ',
  HPpstar: '(Défaut: tous pouvoirs)',

  HPopnotpin_0: 'Succès de l\'opération.',
  HPopnotpin_1: 'Echecs de l\'opération: utilisateur non authentifié.',
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

  HPstuntrust_0: 'Ce terminal n\'a plus ma confiance.',
  HPstuntrust_1: 'Echec du retrait de confiance: utilisateur non enregistré.',
  HPstuntrust_2: 'Echec du retrait de confiance: codes de l\'utilisateur incorrects.',

  HPutd_1: 'Pour information: quand ce terminal n\'est pas déclaré "de confiance", la ou les sessions qui y avaient été "épinglées" ne le sont plus (elles n\'ont plus de données sauvegardées localement):',
  HPutd_2: '- leurs réouverture sont PLUS LONGUES,',
  HPutd_3: '- elles NE SONT PLUS ACCESSIBLES EN MODE AVION.',
  HPutnbs: 'Aucune session initiée sur ce terminal. | Une session est initiée sur ce terminal. | {count} sessions sont initiées sur ce terminal.',
  HPutc1: 'Application',
  HPutc2: 'A propos de la session ...',
  HPsize_1: 'Volumes libérables',
  HPsize_2: 'A supprimer',
  HPskull_0: '{0} sessions(s) et {1} utilisateur(s) seront supprimé(s)',
  HPskull_1: 'Leurs données enregistrées localement seront supprimées. Les sessions "épinglées" ' +
    'seront désépinglées et non accessibles en mode AVION. Ce terminal ne sera plus "de confiance" pour les utilisateurs supprimés.',
  HPclicksession: 'Choisir la session ou profil à ouvrir / rouvrir.',

  HPresetdb_0: 'Ré-initialiser la base locale "Cache"',
  HPresetdb_1: `### Attention !
La base locale Cache sera effacée ce qui provoquera le rechargement _intégral_ de ses données.

- Ceci peut alonger **significativement** la durée d'initialisation de la session.
- Les fichiers attachés aux documents conservés sur ce terminal ne seront plus accessibles en mode avion.
`,

  HPpref_1: 'par défaut',

  HPexpsafe_1: 'Sauvegarde / Restauration de ma Safe Box',
  HPexpsafe_2: `# Faire un backup de ma Safe Box
bla bla
`,
  HPdelsafe_1: 'Suppression irrémédiable de ma Safe Box',
  HPdelsafe_2: `# Suppression irrémédiable de ma Safe Box"
bla bla
`,
  HPdelsafe_3: `# Suppression irrémédiable de ma Safe Box
bla bla
`,
  HPimpsafe_1: 'Importer un backup de ma Safe Box',
  HPimpsafe_2: `# Importer un backup de ma Safe Box"
bla bla
`,
  HPmanusers: 'Gérer les utilisateurs et leurs sessions',
  HPmanu_1: 'Vous disposez du login du terminal, vous pouvez nettoyer les ' +
   ' "utilisateurs" obsolètes (et leurs sessions) à votre convenance',
  HPmanuinfo: `# Gérer les utilisateurs ...
Suppression sélective des utilisateurs et de leurs sessions.
`,
  HPpsab_label: 'A propos de la session ...',
  HPpsab_ph: 'ma session pour ...',
  HPoptstart: 'Options de lancement ...',
  HPusersN: 'Utilisateur(s) sans sessions épinglées:',
  HPusersY: 'Utilisateur(s) ayant des sessions épinglées:',

  HPadminA_label: 'Gérer mes rôles d\'Adiministrateur',
  HPadminA_bub: `# Gérer mes rôles d\'Adiminstrateur Technique
  bla bla
`,
  HPadminA_add: 'M\'ajouter en tant qu\'Administrateur',
  HPadminA_ko: 'Vous n\'êtes pas enregistré comme Administrtaur Technique par l\'opérateur [{0}] pour le service [{1}].',
  HPadminA_lst: 'Liste des couples service / opérateur dont vous êtes Administrateur Technique.',
  HPadminkosvc: 'Ce service n\'est assuré par cet opérateur.',
  HPinvtit_1: 'Déposer une demande',
  HPinvtit_1_label: 'Déposer une demande (invitation ...)',
  HPinvtit_1_bub: `### Déposer une demande...
- d'invitation à un groupe ...
- de création d'un compte ...
- d'obtention d'un pouvoir ...
- etc,
en choisissant le type de demande, l'organisation concernée et les choix associés.
`,
  HPinvtit_2: 'Lister mes demandes',
  HPinvtit_2_label: 'Suivre mes demandes en cours',
  HPinvtit_2_bub: `## Suivre mes demandes
- quelle proposition m'a été faite,
- les adapter,
- etc,
`,

  HPinvco_1: 'Je n\'ai pas de compte',
  HPinvco_2: 'J\'ai un compte',
  HPinvco_3: 'Vous avez un compte puisque vous l\'avez utilisé pour déposer une demande d\'invitation il y a certain temps.',
  HPinvnc_bub: `## Disposer d'un compte est nécessaire...
pour déposer et suivre des demandes d'invitation.
Une **Safe Box** est créée pour mémoriser en toute sécurité les données "de sécurité" de son propriétaire:
- qui est le seul à connaître la clé qui **crypte** son contenu,
- la _Safe Box_ est hébergé, soit sur le **Site générique**, soit sur le site spécifique de son choix.
`,

  // SafeHome
  SFHnewr: 'Nouvelle demande',
  SFHscan: 'Lister et gérer',
  SFHreq: 'Demandes d\'invitations',
  SFHvisit_label: 'Ouvrir l\'application en mode "visiteur"',
  SFHvisit_bub: `## Mode _VISITEUR_
bla bla
`,
  SFHcalc_label: 'Ouvrir l\'application en mode "calculette" (SANS réseau)',
  SFHcalc_bub: `## Mode _CALCULETTE_
bla bla
`,

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

  SECsite_std: 'standard',
  SECsite_msg1: 'INACCESSIBLE',
  SECsite_msg2: 'ATTENTE VERIF',
  SECsitech_label: 'Choisir / saisir le site',
  SECsitech_bub: `## Choisir / saisir le site
- soit: Sélectionner l'un des sites répertoriés par l'application
- soit saisir son URL comme https://notresite.org
`,
  SECsite_label: 'Site de confiance',
  SECsite_bub: `## Site de confiance
Le _site de confiance_ choisi par un utilisateur héberge son **dossier personnel d\'authentification**.
- Pour toute autre personne que son propriétaire, le dossier est **opaque et anonyme**:
  - les _pseudos et phrase secrètes_ qui y figurent ne sont lisibles que par lui.
  - il est _crypté_ par un jeu de clés qui ne se révellent que par la connaissance dd'une phrase longue connue de son seul proriétaire.
- Le dossier personnel contient,
  - les éléments cryptographiques d'authentification de son détenteur.
  - la liste des _terminaux de confiance_ sur lesquels les applications peuvent laisser des données, cryptées, en mémoire cache afin d'accéler la reprise de leurs sessions et pouvoir les utiliser en mode _AVION_.
  - la liste des _pouvoirs sur diverses données et opérations_ acquis au cours du temps.
  - des _préférences_ facilitant le déroulé des sessions:
    - _sessions nommées_ avec une liste de pouvoirs adaptée à certaines activités fréquentes,
    _ jeux _d'options et réglages_ préférentiels de comportement et d'affichage applicables selon le profil d'activité souhaité et le type de terminal utilisé.

#### Site standard
Un Site de confiance **standard** est géré (déploiement, sécurité, etc.) et mis à disposition de tout utilisateur.

#### Sites spécifiques
Des utilisateurs, ou toutes formes de collectifs d'utilisateurs, peuvent toutefois opter pour disposer d'un **site spécifique** de leur choix:
- dont ils maîtrisent entièrement le déploiement d'un logiciel simple écrit en PHP (lisible et compréhensible avec un minimum d'expertise),
- dont les données résident, cryptées, dans la base de données de leur choix.
- dont ils assument eux-mêmes la gestion (sécurité, disponibilité, etc.).

<img src="images/flowers.png" style="background-color:white">

Une liste de _sites connus de l'application_ est proposée avec un **libellé** qui facilite la sélection par l'utilisateur.
Pour désigner un site non répertorié, l'utilisateur est convié à donner son URL.

Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>

`,
  LOGcreate_tit: 'Déclaration d\'un compte sur invitation',
  LOGcreate_pwd_label: 'Mot de passe de l\'administrateur à créér',
  LOGcreate_inv_label: 'Code d\'invitation',
  LOGcreate_noid: 'Mot de passe non reconnu.',
  LOGcreate_noinv: 'Aucune proposition n\'a été trouvée pour ce code d\'invitation',
  LOGcreate_cr: 'Enregistrement du compte déjà effectuée, utiliser la procédure normale de "login".',
  LOGcreate_ok: 'Vous êtes enregistré, votre "Safe Box" a été crrée',
  LOGcreate_bub: `## Déclaration d'un compte sur invitation
bla bla
`,
  LOGplaneimp2: 'Login en mode "Avion" impossible, aucun utilisateur enregistré sur ce terminal n\'a de base locale Cache.',
  LOGauthplane_label: 'Login en mode "Avion" possible pour:',
  LOGauthplane_bub: `# Authentification en mode "Avion"
Si vous avez **certifié** ce terminal, vous vous authentifier par une de vos phrases secrètes.
`,
  LOGauthbypin_label: 'Login par code PIN possible pour:',
  LOGauthbypin_bub: `# Authentification par code PIN
Si vous avez **certifié** ce terminal, votre code PIN suffit à vous authentifier.

Cliquer dans la liste sur vos initiales données lors de la certification.
S'il n'y est pas, c'est que la certification a été retirée à ce terminal.

> La seconde saisie consécutive erronnée d'un code PIN supprime la certification de ce terminal.

> Vous _pouvez_ toujours utiliser l'authentification **forte**.
`,
  LOGauthbypin_1a: 'Je suis l\'utilisateur [{0}] certifié sur ce terminal',
  LOGauthbypin_1b: 'Je suis un des {0} utilisateurs certifiés sur ce terminal...',
  LOGapdiag_1: 'Un des alias de la Safe Box est requis.',
  LOGapdiag_2: 'Une des phrases secrètes d\'ouverture de la Safe Box est requise.',
  LOGapdiag_3: 'Aucune "Safe Box" n\'est enregistrée sous cet alias.',
  LOGapdiag_4: 'Cette phrase n\'ouvre pas la Safe Box',
  LOGap_label: 'Ouvrir une Safe Box par "alias / phrase"',
  LOGap_bub: `# Ouvrir une Safe Box par "alias / phrase"
bla bla
`,
  LOGback: 'Retour au Login',
  LOGsession: 'Ouvrir une session',
  LOGcalc_label: 'Ouvrir une session en mode "Calculette"',
  LOGcalc_bub: `### Ouvrir une session SANS Internet et SANS accès à la mémoire _Cache_: mode **CALCULETTE**
Sans accès Internet, ni accès à aucun document ni fichier (NI des services _cloud_, NI de la mémoire _cache_ locale) l'application travaille en mode _calculette_: les fonctionnalités proposées sont en conséquence en général très restreintes (mais celà dépend de l'application).

`,
  LOGmode_1: 'Mode synchronisé',
  LOGmode_2: 'Mode incognito',
  LOGmode_3: 'Mode avion',
  LOGmode_4: 'Mode calculette',
  LOGnet_1: 'Accès à Internet',
  LOGnet_2: 'AUCUN accès à Internet',
  LOGloc_1: 'Accès aux données cryptées de l\'application en "Cache" sur ce terminal',
  LOGloc_2: 'AUCUN accès aux données stockées sur ce terminal',
  LOGloc_3: `### Accès aux données en _Cache_ sur ce terminal
La session bénéficie de copies locales cryptées de documents :
- ouverture plus rapide et plus économe du réseau et en temps de calcul.
- ouverture en *mode **AVION** possible en l'absence d'accès à Internet.

#### ### Accès aux données en _Cache_
<img src="images/flowers.png" style="background-color:white">
Une session ignore complètement l'existence d'une mémoire _cache_ locale de documents.
- le chargement des documents est plus long et plus coûteux.
- le mode **AVION** en l'absence d'accès à Internet n'est PAS disponible.
- en contrepartie, la session ne laisse AUCUNE TRACE de son exécution sur le terminal.

Dans la documentation générale, lire <a href="$$/appli/alertes.html" target="_blank">Alertes et restrictions d'accès associées</a>
`,

  LOGnet_3: `## Ouverture de session AVEC ou SANS Internet
#### CERTIFICATION d'un terminal par un utilisateur
Un utilisateur peut **certifier** un terminal en lesquel il a _confiance_ :
- en ayant accès à Internet, il pourra s'y authentifier ensuite avec un simple code PIN,
- il y disposera d'une mémoire _Cache_ locale cryptée: sans accès à Internet il pouura y ouvrir des sessions en mode AVION.

### Ouvrir une session AVEC Internet
C'est le mode _normal_ SYNCHRONISE: les documents et fichiers de la base centrale sont accédés en respectant les _pouvoirs_ de la session ouverte.
Quand la session a accès à la mémoire locale _cache_ des documents, 
- les documents lus depuis Internet sont stockés localement en _Cache_ cryptée pour l'utilisateur,
- en cours de session, leurs mise à jour éventuelles sont notifiées à la session qui recharge ceux ayant changé,
- beaucoup de documents sont accessibles sans utiliser Internet.

## Rouvrir SANS Internet une session qui a été antérieurement ouverte en mode synchronisé: mode **AVION**
La session a accès en lecture aux documents et certains fichiers, dans l'état où ils étaient à la fin de la dernière session ouverte avec Internet accessible.

### Ouvrir une session SANS Internet et SANS accès à la mémoire _Cache_: mode **CALCULETTE**
Sans accès Internet, ni accès à aucun document ni fichier (NI des services _cloud_, NI de la mémoire _cache_ locale) l'application travaille en mode _calculette_: les fonctionnalités proposées sont en conséquence en général très restreintes (mais celà dépend de l'application).

`,
  SEStit: 'Votre "Safe Box" sera hébergée sur le site',
  CRRnocred: 'Aucun pouvoir n\'est enregistré.',
  CRRtit_label: 'Revue de mes pouvoirs',
  CRRtit_bub: `### Revue de mes pouvoirs
Vue par service / organisation
bla bla
`,
  CRRstep_2: 'Pouvoirs enregistrés pour {0} / {1}',
  CRRcond: 'Propriétés spécifiques de ce pouvoir:',
  CRRobs1: 'Ce pouvoir est obsolète, il a été supprimé en central. Il sera nettoyé.',
  CRRdel: 'Ce pouvoir est applicable. Voulez-vous cependant y renoncer?',
  CRRdel2: 'Ce pouvoir est applicable mais vous l\'avez supprimé. Voulez-vous le rétablir?',
  CRRlimit: 'Ce pouvoir a une limite de validité: {0}',
  CRRmore: `Ce pouvoir détient des données spécifiques à sa classe de document.

  [{0}]
`,
  CRRabout_label : 'Commentaire privé à propos du pouvoir',
  CRRabout_bub : `### Commentaire privé à propos du pouvoir
  Il aide à retrouver à qui sert ce pouvoir, en particulier pour constituer des profils de sessions ayant une liste réduite de pouvoirs.
  Ce texte est éditable.
  Il est strictement privé et crypté (vous seul le voyez).
`,

  SFTtit: 'Ma Safe Box',
  SFTmdAdmin: 'Administrateur du Master Directory',
  SFTus: 'Identifiant:',
  SFTps: 'Terminal certifié - Pseudo local:',
  SFTnops: 'Terminal NON certifié (pas de pseudo local).',
  SFTa1: 'Alias 1:',
  SFTa2: 'Alias 2:',
  SFTa2n: 'Pas d\'alias 2',
  SFTadmin: 'Administrateur Technique de:',
  SFTexppub: 'Clés publiques',
  SFTguest: 'Mode "invité", pas d\'utilisateur authentifié.',
  SFTalias_label: 'Changer les alias de la Safe Box',
  SFTalias_bub: `### Changer les alias de la Safe Box
bla bla
`,
  SFTphrase_label: 'Changer les phrases d\'ouverture de la Safe Box',
  SFTphrase_bub: `### Changer les phrases d\'ouverture de la Safe Box
bla bla
`,
  SFTopal: 'Opérations DANGEREUSES à utiliser avec précaution',

  SFXps_label: 'Phrase secrète d\'ouverture de votre Safe Box (1 ou 2)',
  SFXps_ko: 'Cette phrase n\'est pas reconnue',
  SFXcfex_tit: 'Confirmer la sauvagarde',
  SFXcfex_txt: `### Restauration de votre Safe Box
-
- sa clé de cryptage est votre phrase secrèté #{0}.
- elle n'a aucun _alias_: il sera à fournir à la restauration.
- le fichier aura pour nom [{1}].
`,
  SFXcfex_0: 'Je renonce',
  SFXcfex_1: 'Je confirme "SAUVEGARDER"',
  SFXbkpok: 'Sauvegarde disponible sous le nom [{0} dans le répertoire de Téléchargements.',

  SFXimpsafe_1: 'Importer une sauvegarde de votre Safe Box',
  SFXimpsafe_2: `### Importer une sauvegarde de votre Safe Box
bla bla
`,
  SFXimpsafe_ko1: 'Fichier illisible.',
  SFXimpsafe_ko2: 'Le fichier ne peut pas être décrypté par la phrase secrète que vous avez saisie.',
  SFXimpsafe_ko3: 'Le fichier a pu être décrypté mais semble corrompu: la clé majeure de la Safe Box ne peut pas être décrypytée par la phrase secrète que vous avez saisie.',
  SFXimpsafe_ok: 'Le fichier a pu être décrypté et correspond bien à une sauvegarde de votre Safe Box.',
  SFXsafeexists_0: 'Votre Safe Box est actuellement gérée par l\'opérateur standard. Elle ne PEUT PAS être restaurée tant que vous ne l\'avez pas explicitement détruite.',
  SFXsafeexists_1: 'Votre Safe Box est actuellement gérée par l\'opérateur [{0}]. Elle ne PEUT PAS être restaurée tant que vous ne l\'avez pas explicitement détruite.',

  SFXskull_9: 'Votre Safe Box va être irrémédiablement supprimée. Avez-vous effectué une "sauvegarde" par précaution ?',
  SFXskull_8: 'Renoncer ou confirmer.',
  SFXdel: 'Votre Safe Box est définitivement supprimée: la session va s\'arrêter.',

  SFXcfimp_tit: 'Confirmer la restauration',
  SFXcfimp_txt: `### Restauration de votre Safe Box
- site hébergeant votre Safe Box: [{0}]
- alias de connexion: [{1}]
- phrase(s) secrète(s) inchangée(s).

Vous pourrez vous connecter après succès de la restauration.
`,
  SFXcfimp_0: 'Je renonce',
  SFXcfimp_1: 'Je confirme "LA RESTAURATION"',
  SFXimpok: 'Succès de la restauration, vous pouvez vous connecter.',

  EXPexport: 'Sauvegarder',
  EXPrestore: 'Restaurer',

  MNOorgs: 'Service / organisation "managés"',
  MNOnoinvits: 'Pas d\'invitation trouvée',
  MNOsearch0: '(pas de recherche en cours)',
  MNOsearch1: 'Recherche en cours ...',
  MNOinvalid: 'Un administrateur a révoqué certains de vos pouvoirs de "manager": ils vont être "nettoyés.',

  SLCtit_bub: `### Sélection d'un code dans la liste proposée
Dans la zone de sélection, taper quelques lettres qui doivent figurer à l'intérieur du code recherché:
- la liste affichée se rétrécit au fur et à mesure de la sélection demandée.
- la sélection ignore les majuscules / minuscules.
- cliquer sur le code de la liste affichée dès que celui attendu apparaît.
- le premier code listé apparaît comme _sélectionné_.
- appuyer sur le bouton **OK** dans la barre de titre le sélectionne.

Fermer la fenêtre corespond à un NON sélection.
`,
  SLCsel: 'Quelques caractères dans le code recherché',

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

  FORMabout: ' A propos ... ',
  FORMstatus_0: 'En création',
  FORMstatus_1: 'Maj par U',
  FORMstatus_2: 'Maj par T',
  FORMstatus_3: 'Validé',
  FORMstatus_4: 'Annulé',

  FORMnewex: 'Proposition à un utilisateur enregistré',
  FORMnewinv: 'Proposition à une personne N\'AYANT PAS ENCORE de compte',
  FORMpfxinv_label: 'Préfixe du code d\'invitation',
  FORMinvcode: 'Code confidentiel à communiquer au destinataire de l\'invitation:', 
  FORMcopythat: 'J\'ai bien noté',
  FORMinvko: 'Incident technique, l\'invitation N\'A PAS été enregistrée.',
  FORMisinvit: 'invitation',
  FORMnosoa: 'Choisir une organisation',
  FORMnewd: 'Nouvelle demande: {0}',
  FORMnewp: 'Nouvelle proposition: {0}',
  FORMuseralias_label: 'Alias de l\'utilisateur cible',
  FORMnoevents: 'Aucune demande / proposition en cours pour vous actuellement.',
  FORMnoforms: 'Aucune demande / proposition en cours ne peut être traitée par vous actuellement.',
  FORMnoform: 'Incident inattendu probablement temporaire: la demande / proposition n\'a pas été trouvée, l\'ignorer pour l\'instant.',
  FORMtype: 'Type de demande',
  FORMorg: 'Organisation',
  FORMsvc: 'Service',
  FORMversion: 'Dernière mise à jour',
  FORMlimit: 'Expiration',
  FORMstatus: 'Statut',
  FORMuser: 'Utilisateur cible',
  FORMcomment: 'Votre commentaire',
  FORMeditcom: 'Edition de votre commentaire personnel',
  FORMnocomment: '(aucun)',
  FORMbtncancel: 'Annuler ma demande',
  FORMbtnnocrd: 'Ne pas créer ma demande',
  FORMbtnnocrp: 'Ne pas créer ma proposition',
  FORMbtnundo: 'Annuler les modifications en cours',
  FORMbtnrecd: 'Enregistrer ma demande',
  FORMbtnrecp: 'Enregistrer ma proposition',
  FORMbtnokp: 'Accepter la proposition telle quelle',
  FORMbtnokd: 'Accepter la demande telle quelle',
  FORMmsgU: 'Message de l\'utilisateur "demandeur"',
  FORMmsgT: 'Message de l\'utilisateur "tiers proposant"',
  FORMcreat: 'en création',
  FORMdem_1: 'Demande',
  FORMprop_1: 'Propos.',
  FORMdem_2_label: 'Fixé par le "demandeur"',
  FORMprop_2_label: 'Fixé par le "proposant"',
  FORMmsg: 'Messages du "demandeur" et du "proposant"',
  FORMmsg_d: 'De l\'utilisateur "demandeur"',
  FORMmsg_p: 'De l\'utilisateur "proposant"',
  FORMadmin: 'Propositions requérant un privilège "administrateur"',
  FORMnoprops: 'Vous n\'avez aucun pouvoir pour établir une proposition pour cette organisation et ce service.',
  FORMuseralias: 'Un alias de l\'utilisateur destinataire',
  FORMdem_label: 'Type de votre demande',
  FORMdem_bub: `## Type de votre demande
bla bla
`,
  FORMok_FormUpdByU: 'Demande enregistrée avec succès.',
  FORMok_FormUpdByT: 'Proposition enregistrée avec succès.',
  FORMok_FormValidateByU: 'Demande enregistrée et VALIDEE avec succès.',
  FORMok_FormValidateByT: 'Proposition enregistrée et VALIDEE avec succès.',
  FORMok_FormCancel: 'Demande annulée avec succès.',
  FORMprop_OK: 'Proposition correcte',
  FORMdem_OK: 'Demande correcte',

  /*
  Détecté par l'application
  1: erreur fonctionnelle APP
  2: erreur fonctionnelle FW
  3: assertion FW - BUG:
  4: assertion APP - BUG:
  8: FW : Exception technique DB / réseau
  9: APP: Exception technique DB / réseau
  10: FW : Exception technique DB / réseau : configuration suspectée
  11: APP: Exception technique DB / réseau : configuration suspectée
  99: Interruption actionnée par l'utilisateur

  Remonté d'un service - [103, 104, 108, 109, 110, 111] transmises à l'adiministarteur
  101: erreur fonctionnelle FW : non détectable par l'application
  102: erreur fonctionnelle APP : non détectable par l'application
  103: assertion FW - BUG: l'erreur fonctionnelle est censée avoir été bloquée par l'application
  104: assertion APP - BUG: l'erreur fonctionnelle est censée avoir été bloquée par l'application
  105: assertions FW - Données incohérentes non détectables par l'application
  106: assertions APP - Données incohérentes non détectables par l'application
  108: FW : Exception technique DB / réseau
  109: APP : Exception technique DB / réseau
  110: FW : Exception technique DB / réseau : configuration suspectée
  111: APP : Exception technique DB / réseau : configuration suspectée
  */
  EX_sync: 'Incident technique ayant bloqué la synchronisation des données avec le service cloud [{0}]. Essayer de continuer.',
  EX_isApp: 'Erreur détectée par l\'application s\'exécutant sur ce terminal.',
  EX_isSvc: 'Erreur détectée par un service "cloud" et remontée à l\'application s\'exécutant sur ce terminal.',
  EX_toAdmin: 'L\'erreur a été transmise à l\'administrateur technique.',
  EX1_label: 'Données erronées (erreur de saisie ?)',
  EX1_bub: `### Données erronées
  A priori une erreur de saisie a provoqué cette anomalie: corriger et relancer l\'opération.

  _Il n'est toutefois pas impossible que la saisie soit correcte et la détection d'anomalie ait un BUG._
  `,

  EX3_label: 'Une situation inattendue des données a été détectée ("BUG" probable).',
  EX3_bub: `### Une situation inattendue des données a été détectée
  - les données ne sont pas dans un état _normal_ pour supporter cette opération.
  - ceci peut provenir d'un BUG de traitement bien antérieur mais aussi peut-être de l'opération qui vient d'échouer.

  Vous pouvez continuer, l'opération ne s'est pas terminée correctement mais _a priori_ sans conséquences futures.
  Recharger l'application _peut_ être bénéfique, comme sa relance ultérieure, les données peuvent avoir évolué favorablement (en étant optimiste).
  `,

  EX8_label: 'Une erreur technique inattendue a été récupérée.',
  EX8_bub: `### Une erreur technique inattendue a été récupérée
  - des données indispensables à l'exécution de cette opération n'ont pas pu être accédées.
  - _a priori_, il s'agit d'un incident **technique** sans rapport direct avec l'opération demandée, une base de données non lisible, un accès à un service distant interrompu, etc.
  - ce peut être aussi un BUG.

  L'opération ne s'est **PAS** terminée correctement et ceci **PEUT** avoir des conséquences sur le comportement futur de votre session.
  Relancer l'opération après un certain délai _peut_ être bénéfique, les incidents techniques sont souvent fugitifs ou de courte durée.
  La relance de l'application, _peut_ (parfois) modifier les circonstances et permettre une poursuite de l'exécution.
  `,

  EX10_label: 'Une erreur technique inattendue a été récupérée, (peut-être un problème de configuration).',
  EX10_bub: `### Une erreur technique inattendue a été récupérée
  - un problème de configuration est supecté (donc un BUG).
  - des données indispensables à l'exécution de cette opération n'ont pas pu être accédées.
  - _a priori_, il s'agit d'un incident **technique** sans rapport direct avec l'opération demandée, une base de données non lisible, un accès à un service distant interrompu, etc.

  L'opération ne s'est **PAS** terminée correctement et ceci **PEUT** avoir des conséquences sur le comportement futur de votre session.
  Relancer l'opération après un certain délai _peut_ être bénéfique, les incidents techniques sont souvent fugitifs ou de courte durée.
  La relance de l'application, _peut_ (parfois) modifier les circonstances et permettre une poursuite de l'exécution.
  `,

  EX105_label: 'Une situation inattendue des données a été détectée ("BUG" probable).',
  EX105_bub: `### Une situation inattendue des données a été détectée par le serveur
  - les données ne sont pas dans un état _normal_ pour supporter cette opération.
  - ceci peut provenir d'un BUG de traitement bien antérieur mais aussi peut-être de l'opération qui vient d'échouer.

  L'opération ne s'est **PAS** terminée correctement et ceci **PEUT** avoir des conséquences sur le comportement futur de votre session.
  Recharger l'application _peut_ être bénéfique, comme sa relance ultérieure, les données peuvent avoir évolué favorablement (en étant optimiste).
  `,

  EX99_label: 'Interruption volontaire d\'une opération par appui volontaire sur le bouton rouge',
  EX99_bub: `### Interruption volontaire d\'une opération
  - par appui volontaire sur le bouton rouge.
  - il est impossible de savoir si l\'opération s\'est bien effectuée ou non.

  Regarder les données affichées pour en déduire si l\'opération est allée à son terme ou a été interrompue avant.
  `,

  EX99_interrupted: 'Interrompu par l\'utilisateur',

  EX3_not_configured_service: 'Service non configuré ou inconnu: [{0}].',
  EX3_document_name_syntax: 'Nom de classe de document mal formé: [{0}].',
  EX3_document_name_duplicated: 'Nom de classe de document dupliquée: [{0}].',
  EX3_property_name_syntax: 'Nom de propriété de pk mal formé: [{0}].',
  EX3_property_name_duplicated: 'Nom de propriété dupliquée: [{0}].',

  EX3_invalid_class_name: 'Nom de classe de document pas sous la forme SVC$DocCl_subClassnon configurée: [{0}].',
  EX3_not_configured_doc_class: 'Classe de document non configurée: [{0}].',
  EX3_unknown_org: 'Org: [{0}]',
  EX3_unknown_url_for_site: 'Site: [{0}]',
  EX3_unknown_service_for_org: 'Org: [{0}] - Service: [{1}]',

  EX3_IDB_keyK_not_declared: 'IDB_keyK_not_declared',
  EX3_svc_org_$OP_not_found: 'svc_org_$OP_not_found',
  EX3_svcopurl_not_found: 'svcopurl_not_found. Service: [{0}] - StatusText: [{1}]',
  EX3_svcorgurl_not_found: 'svcorgurl_not_found. Organisation: [{0}] - Service: [{1}]',
  EX3_safeStore_url_not_found: 'safeStore_url_not_found. Safestore: [{0}]',
  EX3_not_compilable_document: 'Document reçu illisible (Bug probable): ' +
    'Organisation: [{0}] - Service: [{1}] - Classe: [{3}] - PK: [{4}] - Détail: [{5}]',

  EX8_IDB_error: 'IDB_error. Détail: [{0}]',
  EX8_IDB_SAFE_error: 'IDB_error. Détail: [{0}]',
  EX8_HTTP_not_200: 'HTTP pas 200. Status: [{0}] - StatusText: [{1}]',
  EX8_HTTP_500_etc: 'HTTP 500 etc. Status: [{0}] - URL: [{1}] - StatusText: [{2}]',
  EX8_unexpected_network_service_response: 'unexpected_network_service_response. URL: [{0}] - Détail: [{1}]',

  EX101_masterdir_no_admin: 'masterdir_no_admin',
  EX101_masterdir_svc_unkown_or_not_implemented_by_op: 'Service: [{0}] - Opérateur: [{1}] - Organisation: [{2}]',
  EX101_operation_admin_required: 'operation_admin_required',
  EX101_operation_authentication_required: 'operation_authentication_required',
  EX101_operation_no_user_keys_cv: 'operation_no_user_keys_cv',
  EX101_operation_bad_signature: 'operation_bad_signature',
  EX101_operation_bad_credentials: 'Rôles KO: [{0}]',
  EX101_invalid_json_topic_update: 'Détail: [{0}]',
  EX101_invalid_key_topic: 'Topic: [{0}] - Key: [{1}]',

  EX102_error_test: 'Test d\'erreur. Arg1: [{0}] - Arg1: [{1}]',

  EX103_unregistered_safestore_site: 'SafeStore: [{0}] - Site: [{1}]',
  EX103_unregistered_safestore: 'SafeStore: [{0}]',
  EX103_unregistered_org: 'Org: [{0}]',
  EX103_unregistered_service_for_org: 'Service: [{0}] - Org: [{1}]',
  EX103_unregistered_svc_org_site: 'Service: [{0}] - Org: [{1}] - Site: [{2}]',
  EX103_origin_not_authorized: 'Origine: [{0}]',
  EX103_unknown_operation: 'Opération: [{0}]',
  EX103_unknown_organisation: 'Opération: [{0}] - Organisation: [{1}]',
  EX103_unsupported_API: 'Application: [{2}] - Service: [{0}] [{1}] - build: [{3}]',
  EX103_masterdir_unknown_operation: 'Opération: [{0}]',
  EX103_invalid_object_argument: 'Argument: [{0}]',
  EX103_invalid_bin_argument: 'Argument: [{0}]',
  EX103_invalid_array_argument: 'Argument: [{0}]',
  EX103_invalid_string_argument: 'Argument: [{0}]',
  EX103_invalid_string_array_argument: 'Argument: [{0}]',
  EX103_invalid_int_argument: 'Argument: [{0}]',
  EX103_invalid_bool_argument: 'Argument: [{0}]',
  EX103_missing_argument_name: 'missing_argument_name',
  EX103_missing_argument: 'Argument: [{0}]',
  EX103_invalid_argument: 'Argument: [{0}]',
  EX103_SafeOperation_unknown_operation: 'Opération: [{0}]',
  EX103_missing_credential: 'Credential recherché et non transmis à l\'opération. Organisation: [{0}] - Role: [{1}] - DocId: [{2}]',
  EX103_no_cred_owner: 'Tentative de révocation d\'un credential dont l\'utilisateur n\'est propriétaire. Role: [{1}] - DocId: [{2}]',
  EX103_missing_p1_and_p2: 'Tentative de remplacement des phrases secrètes sans les fournir.',

  EX103_invalid_class_name: 'Nom de classe de document pas sous la forme SVC$DocCl_subClassnon configurée: [{0}].',
  EX103_not_configured_service: 'Service non configurée: [{0}].',
  EX103_not_configured_doc_class: 'Classe de document non configurée: [{0}].',

  EX105_Subscription_unknown_session: 'SessionId: [{0}]',
  EX105_masterdir_unexpected_exception: 'Opération Master Directory en échec inattendu. Détail: [{0}]',
  EX105_service_unexpected_exception: 'Opération Service en échec inattendu. Détail: [{0}]',
  EX105_safe_unexpected_exception: 'Opération Safe Box en échec inattendu. Détail: [{0}]',
  EX105_masterdir_arguments_notdecodable: 'Opération Master Directory: impossible de décoder les arguments.',
  EX105_service_arguments_notdecodable: 'Opération Service en échec inattendu. impossible de décoder les arguments.',
  EX105_safe_arguments_notdecodable: 'Opération Safe Box en échec inattendu. impossible de décoder les arguments.',
  EX105_masterdir_case_chk: 'Accès au masterdir "case" avec une clé d\'authentification "chk" non valide.',
  EX105_userid_not_found_in_masterdir: 'L\'utilisateur [{0}] n\'est pas enregistré.',
  EX105_credential_required_not_found: 'Un pouvoir requis n\'a pas été transmis au service par l\'application (BUG probable): [service: {0}, classe:{1}, id:{2}]',

  EX108_SQLite_connexion_failed: 'Détail: [{0}]',
  EX108_masterdir_db_error_mdSetValue: 'Détail: [{0}]',
  EX108_masterdir_db_error_mdGetValue: 'Détail: [{0}]',

  EX108_masterdir_challenge_too_old: 'masterdir_challenge_too_old',
  EX108_remote_md_safes_access_400: 'MasterDirectory ou Safe non accessible. Url:[{0}] status:[{1} texte:[{2}]',
  EX108_remote_md_safes_access_exc: 'MasterDirectory ou Safe, accès en échec. Url:[{0}] status:[{1} texte:[{2}]',

  EX110_FilesystemStorage_path_not_found: 'Rootpath: [{0}]',
  EX110_DbConnector_credentials_not_found: 'DbConnector_credentials_not_found',
  EX110_DbConnector_missing_crypt_key: 'DbConnector_missing_crypt_key',
  EX110_startSRV_certificate_not_found: 'Path: [{0}]',
  EX110_startSRV_private_key_not_found: 'Path: [{0}]',
  EX110_DB_lock: 'Détail: [{0}]',
  EX110_SQLite_path_not_found: 'Path: [{0}]',
  EX110_SQLite_path_missing: 'SQLite path missing',

  EX_quit: 'Quitter l\'application',
  EX_reload: 'Relancer l\'application',
  EX_continue: 'Poursuivre la session quand même',

  CATEG_AS2_ad: '01Administration générale',
  CATEG_AS2_auteurs: '02Auteurs et relecteurs',

  TYPE_AS2_membrecodir: '01Nomination au Comité de Direction',
  TYPE_AS2_membrecodir_det: 'Nom / pseudo: {0}',
  TYPE_AS2_membrecodir_pseudo: 'Nom / pseudo connu des autres membres du comité',

  TYPE_AS2_membreredaction: '01Nomination au Comité de Rédaction',
  TYPE_AS2_membreredaction_det: 'Nom / pseudo: {0}',
  TYPE_AS2_membreredaction_pseudo: 'Nom / pseudo connu des autres membres du comité',

  TYPE_AS2_auteur: '02Création d\'un nouvel auteur',
  TYPE_AS2_auteur_det: 'Nom d\'auteur: {0}',
  TYPE_AS2_auteur_nomAuteur: 'Nom d\'auteur',
  TYPE_AS2_auteur_trigramme_det: 'Trigramme: {0}',
  TYPE_AS2_auteur_section: 'Section concernée du Comité de Rédaction',
  TYPE_AS2_coauteur_nomAuteur: 'Nom d\'auteur',
  TYPE_AS2_coauteur_trigramme: 'Trigramme en tant que "co-auteur"',

  TYPE_AS2_coauteur: '02Nomination en tant que co-auteur d\'un auteur',
  TYPE_AS2_coauteur_det: 'Surnom: {1}',

  FORM_AS2_diag_lgp: 'Le "pseudo" doit avoir entre 8 et 24 caractères.',
  FORM_AS2_diag_pseudo: 'Format incorrect du "pseudo": {0}.',
  FORM_AS2_diag_nomAuteur: 'Format incorrect du "nom d\'auteur": {0}.',
  FORM_AS2_diag_nomAuteur2: 'Saisie du "nom d\'auteur" non fixée par "OK".',
  FORM_AS2_diag_section: 'Un "nom de section" est requis.',
  FORM_AS2_diag_nomDupl: 'Ce "nom d\'auteur" est déjà celui d\'un auteur existant.',
  FORM_AS2_diag_nomInexistant: 'Aucun auteur ne porte ce nom.',
  FORM_AS2_diag_trigramme: 'Un "trigramme" est requis.',

  STFO_auteur_101: 'Ce "nom d\'auteur" est déjà celui d\'un auteur existant.',

  CREDON_CoDir: 'Membre du Comité Directeur',
  CREDON_CoDir_bub: `### Membre du Comité Directeur
  bla bla 
  `,
  CREDON_Redaction: 'Membre du Comité de Rédaction',
  CREDON_Redaction_bub: `### Membre du Comité de Rédaction
  bla bla 
  `,
  CREDON_Auteur: 'Auteur',
  CREDON_Auteur_bub: `### Auteur
  bla bla 
  `,

  AUTcol_id: 'Identifiant',
  AUTcol_na: 'Nom d\'auteur',
  AUTcol_sec: 'Section',
  AUTcol_trig: 'Votre trigramme de "co-auteur"',
  AUTcol_co: 'Pas de co-auteur | Un co-auteur | {count} co-auteurs',
  AUTko_1: 'Auteur non trouvé (disparu ?, BUG ?)',
  AUTnotrig: '(pas de trigramme)',
  AUTko: 'Auteur inconnu',

  ENUM_Section_roman: 'Roman',
  ENUM_Section_histoire: 'Histoire',
  ENUM_Section_sf: 'Science fiction',
  
  moins1: 'Moins 1',
  plus1: 'Plus 1',
  pickfile: 'Choisir un fichier local',
  blabla: 'bla bla', // Test surcharge traductions
  blabla1: 'bla1 bla1', // Test surcharge traductions
  titre: 'Test très simple - compteur: {0}',

  noopts: 'Aucune option à saisir.'

}
