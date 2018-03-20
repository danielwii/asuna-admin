# Asuna-Admin

## Develop

根据 `.env.example` 创建 `.env` 并配置对应的服务地址。

```bash
yarn                 # install dependencies
yarn dev             # run server as dev mode
ENV=staging yarn dev # run dev mode using staging env
```

## Run in docker

```bash
# build with code
docker build -t asuna-admin .

# build with asuna
yarn asuna docker
docker run --rm -it --env ENV=staging -p 3000:3000 asuna-admin yarn dev
```

## Quick Start

1. Get the package.
    ```bash
    git clone -o asuna -b master --single-branch git@github.com:danielwii/mast-admin.git admin
    cd admin && yarn
    ```
2. Setup env.
    ```bash
    cp .env.example .env
    ```
3. Setup services/definitions

## Sonar

```bash
sonar-scanner -Dsonar.projectKey=asuna-admin -Dsonar.sources=. -Dsonar.exclusions=stories/**/*
```

## Using subtree

1. Create
    ```bash
    git remote add asuna-admin git@github.com:danielwii/asuna-admin.git
    git subtree add --prefix asuna-admin asuna-admin master
    ```

2. Update.
    ```bash
    git subtree pull --prefix asuna-admin asuna-admin master
    ```
## Config

### ModelColumns

```javascript
modelColumns = {
  [modelName]   : {
    associations: {
      [associationName]: {
        name  : 'name',
        value : 'id',
        // ref   : 'refName',   // using to update data, when it's not same as `associationName`.
        fields: ['id', 'name'],
      },
    },
  },
}
```

## Changelog

- 0.0.2 - Mar 2 2018 - 修改视频对象结构为 JSON。
