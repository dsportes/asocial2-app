export const K = {
  APPNAME: 'asocial2',
  ADMIN: 'oKqMNBgdGotqrhdE9dChrJ8WY_b821OnauupPZiY5cg',
  DIRECTORY_URL: 'http://localhost:8080/',
  // 'https://europe-west1-asocial2.cloudfunctions.net/asocialgcf/'
  vapidPublicKey: 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew',

  BUILD: 'v2.1',
  APIVERSION: 1,
  localeOptions: [
    { value: 'en', label: 'English',  flag: '🇬🇧' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' }
  ],
  SYNCINCRNBD: 90, // nombre de jours de validité des synchros incrémentales

  docsurls: { en: 'https://asocialapps.github.io/frdocs/', fr: 'https://asocialapps.github.io/frdocs/'},

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
