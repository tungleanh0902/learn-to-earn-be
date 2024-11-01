FROM node:16-alpine AS build

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY package.json .

RUN npm install

COPY . . 

RUN npm run build

FROM node:16-alpine AS run

WORKDIR /usr/app

COPY --from=build /usr/app/package*.json /usr/app
COPY --from=build /usr/app/ecosystem.config.js /usr/app
COPY --from=build /usr/app/dist /usr/app/dist

RUN npm install --omit=dev --legacy-peer-deps --no-cache

RUN npm cache clean --force

RUN npm install -g pm2

EXPOSE 8080

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
