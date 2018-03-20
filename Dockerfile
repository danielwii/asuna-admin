FROM node:9

COPY package.json /app/
COPY bin /app/bin

WORKDIR /app

RUN yarn

ADD . /app

EXPOSE 3000
