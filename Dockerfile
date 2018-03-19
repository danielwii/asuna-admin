FROM node:9

COPY package.json yarn.lock /app/
COPY bin /app/bin

WORKDIR /app

RUN yarn

ADD . /app

EXPOSE 3000
