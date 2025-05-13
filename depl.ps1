$depl = "D:/git/asocialapps_t2"
$pub = "D:/git/asocial2-app/public"
$dtest = "D:/git/asocial2-app/dist-test"
$dt2 = "D:/git/asocial2-app/dist-t2"
$base = "D:/git/asocial2-app"
$dist = "D:/git/asocial2-app/dist/pwa"

Copy-Item -Force -Verbose -Path $dt2/README.md -Destination $pub/
Set-Location -Path $base
yarn quasar build -m pwa

Set-Location -Path $depl
Get-ChildItem -exclude .git | Remove-Item -recurse -force
Set-Location -Path $base
Copy-item -Force -Verbose -Recurse $dist/* -Destination $depl
Copy-Item -Force -Verbose -Path $dtest/README.md -Destination $pub/
Write-Output "OK"
