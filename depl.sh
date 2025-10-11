#! /bin/bash

echo $HOME

depl=$HOME/git/asocialapps-t2
temp=$HOME/git/temp
pub=$HOME/git/asocial2-app/assets
dtest=$HOME/git/asocial2-app/dist-test
dt2=$HOME/git/asocial2-app/dist-t2
base=$HOME/git/asocial2-app
dist=$HOME/git/asocial2-app/dist/pwa

cp -f $dt2/README.md $pub/
cp -f $dt2/custom.json $pub/

mv $depl/.git $temp
cd $base
yarn quasar build -m pwa

rm -rf $depl/*
cp -r $dist/* $depl
mv $temp/.git $depl

cp -f $dtest/README.md $pub/
cp -f $dtest/custom.json $pub/

echo "OK"
