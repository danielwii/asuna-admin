FROM node

# set `--build-arg` in docker build
ARG REGISTRY=https://registry.yarnpkg.com

COPY package.json /app/
COPY bin /app/bin

WORKDIR /app

RUN yarn config set registry $REGISTRY && yarn

ADD . /app

RUN yarn build

EXPOSE 3000

CMD yarn start
