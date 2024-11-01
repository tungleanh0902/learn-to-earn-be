FROM node:16-alpine AS build

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY package.json .

RUN npm install --omit=dev --legacy-peer-deps --no-cache

COPY . . 

RUN npm run build

FROM node:16-alpine AS run

WORKDIR /usr/app

COPY --from=build package*.json ./
COPY --from=build ecosytem.config.js ./
COPY --from=build dist ./dist

RUN npm install --omit=dev --legacy-peer-deps --no-cache

RUN npm cache clean --force

RUN npm install -g pm2

EXPOSE 8080

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
