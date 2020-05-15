FROM node:lts-alpine

RUN apk add --no-cache git python make gcc g++

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node ./package*.json ./

USER node

EXPOSE 4005

RUN npm install && npm cache clean --force --loglevel=error

COPY --chown=node:node ./src ./src

RUN npm run build-crux-bridge-server-without-auth

# COPY --chown=node:node ./dist/crux-gateway-bridge-without-auth.js .
# COPY --chown=node:node lib ./lib/

CMD [ "node", "./dist/crux-gateway-bridge-without-auth.js"]