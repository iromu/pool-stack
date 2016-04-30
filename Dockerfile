FROM node:argon
MAINTAINER Ivan Rodriguez Murillo <wantez@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production
RUN npm install -g forever

# Bundle app source
COPY . /usr/src/app


ENV NODE_ENV docker

ENV APP_NAME "Pool Stack App"
ENV APP_PORT 8080
ENV APP_CLUSTER_ENABLED false
ENV REDIS_URL "redis://localhost:6379"
ENV REDIS_PREFIX "false"
ENV REDIS_PURGEONLOAD false

EXPOSE 8080
CMD [ "forever", "-f", "server.js" ]