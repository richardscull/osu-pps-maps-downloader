pushd %~dp0
call npm install --no-audit
call tsc
node build/main.js
pause
popd
