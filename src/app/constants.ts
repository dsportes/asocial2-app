export interface localeOption { value: string, label: string, flag: string }

export class K {
  static BUILD = 'v2.1'
  static APIVERSION = 1

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

}