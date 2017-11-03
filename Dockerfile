FROM node:8-alpine

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

RUN echo http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories
RUN apk add --update docker

EXPOSE 8080

ENV HOME=/home/app
ENV NODE_ENV=production
WORKDIR $HOME/src

COPY package.json $HOME/src/
RUN npm install --production

COPY . $HOME/src

CMD ["dumb-init", "npm", "start"]
