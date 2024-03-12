FROM --platform=$BUILDPLATFORM node:lts-alpine as base
WORKDIR /app
COPY package.json /
EXPOSE 3000

FROM base as production
ENV NODE_ENV=production
RUN npm install
RUN npm install pm2 -g
COPY . /app
CMD ["pm2-runtime", "start", "index.js", "--instances", "max", "--output", "/app/pm2.log", "--error", "/app/pm2_error.log"]

FROM base as dev
ENV NODE_ENV=development
RUN npm install -g npm@10.5.0
RUN npm install -g nodemon && npm install
COPY . /app
CMD npm run start