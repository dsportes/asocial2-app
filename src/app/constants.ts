export interface localeOption { value: string, label: string, flag: string }

export class K {
  static BUILD = 'v2.1'
  static APIVERSION = 1
  static APPNAME = 'asocial2'

  static vapidPublicKey = 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew'
  
  static urlsrv = 'http://localhost:8080/'
  // static urlsrv = 'https://europe-west1-asocial2.cloudfunctions.net/asocialgcf/'
  
  static localeOptions : localeOption[] = [
    { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
    { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
  ]

  static theme = {
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
  }

  static byeHtml =  `<html><head><meta charset="utf-8">
<style>div {font-size:18px;margin:12px;font-family:sans-serif;text-align:center;};</style>
</head>
<body>
<div>Duplicate application launch in this browser not allowed.</div> 
<div>Le lancement de l'application plus d'une fois dans ce browser n'est pas autorisé.</div>
<a href="https://asocialapps.github.io/frdocs/">Help / Aide</a>
</body></html>`

  static coolbyeHtml (href) {
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