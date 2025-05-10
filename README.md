1.8 - Version fonctionnant avec un appel de GCF déployée sur asocial2
(juste EchoTexte)

Application "asocial-2 (tests divers)":

Build

        yarn quasar build -m pwa
        ./edit.sh

Run

        cd dist
        npx http-server . -p 8086 --cors
    
PUIS: localhost:8086/pwa
