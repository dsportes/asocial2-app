export const K = {
  APPNAME: 'asocial2',
  ADMIN: 'oKqMNBgdGotqrhdE9dChrJ8WY_b821OnauupPZiY5cg',
  SERVICES: {
    asocial2SVC: { url: 'http://localhost:8080/', api: 1 },
  },
  DEFAULT_SERVICE: 'asocial2SVC',
  SAFE_URL1: 'http://localhost:8888/safe.php?',
  SAFE_URL: 'http://localhost:8080/safe/',
  // 'https://europe-west1-asocial2.cloudfunctions.net/asocialgcf/'
  vapidPublicKey: 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew',

  BUILD: 'v2.1',
  localeOptions: [
    { value: 'en', label: 'English 🇬🇧',  flag: '🇬🇧', name: 'English' },
    { value: 'fr', label: 'Français 🇫🇷', flag: '🇫🇷', name: 'Français' }
  ],
  SYNCINCRNBD: 90, // nombre de jours de validité des synchros incrémentales

  docsurls: { en: 'https://asocialapps.github.io/frdocs/', fr: 'https://asocialapps.github.io/frdocs/'},

  sizes: {
    p0: [8, 20],
    p1: [24, 40],
    tr: [3, 8],
    dev: [6, 16],
    pin: [8, 16],
    sn: [3, 40], // Nom des sessions
    about: [4, 64],
    pref: [4, 32],
    org: [3, 16],
    file: [1, 32],
    ps: [8, 40]
  },

  phrasestar: true,

  sizeP0: [8, 20],
  sizeP1: [24, 40],
  sizeTr: [3, 8],
  sizeDev: [6, 16],
  sizePin: [8, 16],
  sizeSn: [3, 40], // Nom des sessions

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
