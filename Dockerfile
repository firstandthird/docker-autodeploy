FROM firstandthird/node:8.8-onbuild

RUN ./bin/install-docker-app

ENV CONFIG_PATH /config
ENV NODE_ENV production
