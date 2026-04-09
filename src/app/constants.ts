export const K = {
  BUILD: 'v2.1',
  APPNAME: 'asocial2',

  SERVICES: {
    AS2: { api: 1 },
    ASSO2: { api: 1 }
  },
  // DEFAULT_SERVICE: 'AS2',

  MASTERDIR_URL: 'http://localhost:8080/safe/',
  FAVORITE_OPS: ['$RED', '$BLUE'],

  /*
  SAFE_URLS: { // Safes spécifiques "bien connus"
    dsphp: 'http://localhost:8888/safe.php?',
    std: 'http://localhost:8080/safe/'
  },
  */

  DOC_URLS: {
    fr: "https://asocialapps.github.io/frdocs/",
    en: "https://asocialapps.github.io/frdocs/",
  },

  FAVORITE_OPERATORS: ['$RED', '$BLUE', '$FRAS'],

  // 'https://europe-west1-asocial2.cloudfunctions.net/asocialgcf/'
  vapidPublicKey: 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew',

  docsurls: { en: 'https://asocialapps.github.io/frdocs/', fr: 'https://asocialapps.github.io/frdocs/'},

  localeOptions: [
    { value: 'en', label: 'English 🇬🇧',  flag: '🇬🇧', name: 'English' },
    { value: 'fr', label: 'Français 🇫🇷', flag: '🇫🇷', name: 'Français' }
  ],
  SYNCINCRNBD: 90, // nombre de jours de validité des synchros incrémentales

  sizes: {
    p0: [8, 20],
    p1: [24, 40],
    tr: [3, 8],
    dev: [6, 16],
    pin: [8, 16],
    sn: [3, 40], // Nom des sessions
    about: [4, 64],
    comment: [4, 80],
    pref: [4, 32],
    org: [3, 16, 'an1'],
    oper: [3, 8, 'oper'],
    stdb: [3, 16, 'b64'],
    file: [1, 32],
    ps: [8, 40],
    entid: [0, 60],
    isotime: [24, 24],
    svc: [3, 8, 'svc'],
    contact: [16, 24],
    minor: [0, 12, 'an2']
  },

  regexp: {
    b64: new RegExp('^[0-9a-zA-Z\-_]*$'),
    num: new RegExp('^[0-9]*$'),
    an1: new RegExp('^[a-z][0-9a-z]*$'),
    an2: new RegExp('^[a-zA-Z][0-9a-zA-Z]*$'),
    oper: new RegExp('^[$][0-9A-Z]*$'),
    svc: new RegExp('^[A-Z][0-9A-Z]*$')
  },

  phrasestar: { ps: 2, p1: 2, contact: 2},

  majorInvits: {
    Auteur: { hasKey: true, hasLabel: true, hasMinor: true },
    Relecteur: { hasKey: false, hasLabel: true, hasMinor: true },
    Cedit: { hasKey: false, hasLabel: false, hasMinor: false }
  },

  theme: {
    primary: ['#0D47A1', '#0D47A1'],
    secondary: ['#33691E', '#33691E'],
    info: ['#82C8E8', '#0101FF'],
    accent: ['#9C27B0', '#9C27B0'],
    positive: ['#21BA45', '#21BA45'],
    negative: ['#C10015', '#C10015'],
    warning: ['#E65100', '#E65100'],
    msgbg: ['#FFF176', '#FFF176'],
    msgtc: ['#B71C1C', '#B71C1C'],
    tbptc: ['#FFFFFF', '#FFFFFF'],
    tbstc: ['#FFFFFF', '#FFFFFF'],
    btnbg: ['#1976D2', '#1976D2'],
    btntc: ['#FFFFFF', '#FFFFFF'],
    btwbg: ['#E65100', '#E65100'],
    btwtc: ['#FFFFFF', '#FFFFFF'],
    mdtitre: ['#64B5F6', '#1565C0']
  },

  /*
  theme: {
    primary: ['#0D47A1', '#BBDEFB'],
    secondary: ['#33691E', '#DCEDC8'],
    info: ['#82C8E8', '#0101FF'],
    accent: ['#9C27B0', '#9C27B0'],
    positive: ['#21BA45', '#21BA45'],
    negative: ['#C10015', '#C10015'],
    warning: ['#E65100', '#E65100'],
    msgbg: ['#FFF176', '#FFF176'],
    msgtc: ['#B71C1C', '#B71C1C'],
    tbptc: ['#82C8E8', '#0101FF'],
    tbstc: ['#DCEDC8', '#212121'],
    btnbg: ['#1976D2', '#1976D2'],
    btntc: ['#FFFFFF', '#FFFFFF'],
    btwbg: ['#E65100', '#E65100'],
    btwtc: ['#FFFFFF', '#FFFFFF'],
    mdtitre: ['#64B5F6', '#1565C0']
  },
  */

  byeHtml:  `<html><head><meta charset="utf-8">
<style>div {font-size:18px;margin:12px;font-family:sans-serif;text-align:center;};</style>
</head>
<body>
<div>Duplicate application launch in this browser not allowed.</div>
<div>Le lancement de l'application plus d'une fois dans ce browser n'est pas autorisé.</div>
<a href="https://asocialapps.github.io/frdocs/">Help / Aide</a>
</body></html>`,

  coolbyeHtml: (href: string) => {
    return `<html><head><meta charset="utf-8">
<style>div {font-size:18px;margin:12px;font-family:sans-serif;text-align:center;};</style>
</head>
<body>
<div>Goodbye, see you soon !</div>
<div>Au revoir et à bientôt !</div>
<div><a href="${href}">Back => Application</a></div>
<div><a href="https://asocialapps.github.io/frdocs/">Help / Aide</a></div>
</body></html>`
  }
}

/*
const reg = K.regexps
const b1 = reg.an1.test('94lhay')
const b2 = reg.an1.test('94Lhay')
const b3 = reg.num.test('09876')
const b4 = reg.num.test('098A6')
const b5 = reg.b64.test('a-_B0')
const b6 = reg.b64.test('a$r')
const b7 = reg.b64.test('ab09')
console.log(b1, b2, b3, b4, b5, b6, b7)
*/
