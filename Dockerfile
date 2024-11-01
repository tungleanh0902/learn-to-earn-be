FROM node:20-alpine AS build

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY package.json .

RUN npm install

COPY . . 

RUN npm run build

FROM node:20-alpine AS run

WORKDIR /usr/app

COPY --from=build /usr/app/package*.json /usr/app
COPY --from=build /usr/app/ecosystem.config.js /usr/app
COPY --from=build /usr/app/dist /usr/app/dist

RUN npm install

RUN npm cache clean --force

RUN npm install -g pm2

EXPOSE 8080

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
