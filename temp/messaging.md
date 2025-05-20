## Réception d'un message envoyé par le serveur

### L'application est en _background_
Elle est,
- soit dans un onglet qui n'est pas celui au top dans le browser,
- soit le browser est en icône.

**Comportement NON modifiable de FCM**
- une notification apparaît dans le tray.
- elle a le texte de message.notification (title et body).
- quand on clique dessus ça pop l'onglet du browser hostant l'application SSI le message a une fcm_options avec un link.

**Comportement codé dans `onBackgroundMessage`**
- Transmission par message SW à `onmsg` de l'application du message émis par le serveur:
- pas d'émission supplémentaire de notification dans le tray: FCM l'a déjà fait.

**Comportement dans `onmsg`** : selon ce que l'application décide elle peut ou non, émettre une notification plus détaillée dans le tray, **en plus donc** de celle de FCM.

### L'application est en _foreground_
Elle s'exécute dans l'onglet visible du browser.

**Comportement de FCM** : rien.

**Comportement codé dans `onBackgroundMessage`** : rien.

**Comportement dans `onmsg`** : selon ce que l'application décide, elle peut émettre une notification complètement applicative dans le tray, sans relation directe avec la payload reçue du serveur.

### Conclusion pour `onBackgroundMessage` 
- ne sert qu'à router les messages vers l'application sur `onmsg`.
- ne génère pas de notification dans le tray.

### L'application nest PAS / PLUS active

**Comportement NON modifiable de FCM**
- une notification apparaît dans le tray.
- elle a le texte de message.notification (title et body).
- quand on clique dessus ça ouvre un NOUVEL onglet du browser avec lancement de l'application SSI le message a une fcm_options avec un link.

**Comportement codé dans `onBackgroundMessage`** : non testable, a priori rien puisqu'il n'y a PAS / PLUS d'application.

## Click suer la notification dans le tray
Traitement uniforme quelque soit la source de la notification:
- émise par FCM,
- émise par `onmsg`.

Les deux ensembles sont possibles quand l'application est en _background_:
- celle de FCM n'est pas évitable dès lors qu'elle a fcm_options.link
- celle émise par onmsg:
  - peut avoir des informations plus riches,
  - ne sait pas si FCM a déjà émis une notification.
