FROM node

# set `--build-arg` in docker build
ARG REGISTRY=https://registry.npm.taobao.org

RUN git clone https://github.com/danielwii/asuna-admin /asuna-admin
WORKDIR /asuna-admin

#COPY services/ /asuna-admin/services/
#COPY .env* /asuna-admin

RUN yarn config set registry $REGISTRY && yarn

VOLUME /asuna-admin/services

EXPOSE 3000

CMD yarn dev
