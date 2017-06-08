FROM node:6-alpine

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

EXPOSE 8080

ENV HOME=/home/app
ENV NODE_ENV=production
WORKDIR $HOME/src

COPY package.json $HOME/src/package.json
RUN npm install --production

COPY . $HOME/src

CMD ["dumb-init", "npm", "start"]
