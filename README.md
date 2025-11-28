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