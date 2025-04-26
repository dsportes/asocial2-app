#! /bin/bash

echo $HOME

depl=$HOME/git/asocialapps-t2
temp=$HOME/git/temp
pub=$HOME/git/asocial-app/public
dtest=$HOME/git/asocial-app/dist-test
dt2=$HOME/git/asocial-app/dist-t2
base=$HOME/git/asocial-app
dist=$HOME/git/asocial-app/dist/pwa

cp -f $dt2/README.md $pub/

mv $depl/.git $temp
cd $base
yarn quasar build -m pwa
sed -i s"/href=\"\//href=\".\//g" $dist/index.html

rm -rf $depl/*
cp -r $dist/* $depl
mv $temp/.git $depl

cp -f $dtest/README.md $pub/

echo "OK"
