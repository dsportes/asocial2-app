1.8 - Version fonctionnant avec un appel de GCF déployée sur asocial2
(juste EchoTexte)

Application "asocial-2 (tests divers)":

Build

        yarn quasar build -m pwa

Run

        cd dist
        npx http-server . -p 8086 --cors -c-1 -S -C "../../asocial2-srv/cert/fullchain.pem" -K "../../asocial2-srv/cert/privkey.pem" -a test.sportes.fr


        cd dist/pwa
        npx http-server . -p 8086 --cors -c-1 -S -C "../../../asocial2-srv/cert/fullchain.pem" -K "../../../asocial2-srv/cert/privkey.pem" -a test.sportes.fr

ET PUIS: localhost:8086/pwa

# Install yarn
Par npm installe la version legacy 1.22

Dernière version: yarn set version stable

# Fontes
Les noms des fontes ne doivent pas contenir de caractères qui nécessitent un encodeURL.
Ca marche avec le réseau mais provoque une erreur de GET en service-worker.
C'est pour ça que le nom originel `Comfortaa[wght].woff2` a été remplacé par `Comfortaa_wght_.woff2`, à la fois dans `/public/fonts` et dans `/src/css`.
