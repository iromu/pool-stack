FROM node:argon
MAINTAINER Ivan Rodriguez Murillo <wantez@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app/

# Bundle app source
COPY . /usr/src/app

RUN npm run-script build

ENV NODE_ENV docker

ENV APP_NAME "Pool Stack App"
ENV APP_PORT 8080
ENV APP_CLUSTER_ENABLED false
ENV REDIS_URL "redis://$REDIS_PORT_6379_TCP_ADDR:$REDIS_PORT_6379_TCP_PORT"
ENV REDIS_PREFIX "false"
ENV REDIS_PURGEONLOAD false

EXPOSE 8080
CMD [ "forever", "-f", "server.js" ]
