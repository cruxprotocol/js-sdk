#!/bin/sh
set -e
echo $EXEC

if [ $EXEC == 'gateway_bridge' ]
then
    npm run build-crux-bridge-server-without-auth
    echo "Gateway Bridge Build: Completed";
    exec node ./dist/crux-gateway-bridge-without-auth.js
elif [ $EXEC == 'crux_saas' ]
then
    exec npm run saas-server
fi
