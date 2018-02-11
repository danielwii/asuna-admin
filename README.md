# Mast-Admin

## Develop

根据 `.env.example` 创建 `.env` 并配置对应的服务地址。

```bash
yarn         # install dependencies
yarn collect # collect static resources
yarn dev     # run server as dev mode
```

## Quick Start

1. Get the package.
    ```bash
    git clone -o mast -b master --single-branch git@github.com:danielwii/mast-admin.git admin
    cd admin && yarn
    ```
2. Setup env.
    ```bash
    cp .env.example .env
    ```
3. Setup services/definitions

## Sonar

```bash
sonar-scanner -Dsonar.projectKey=mast-admin -Dsonar.sources=. -Dsonar.exclusions=stories/**/*
```

## Using subtree

1. Create
    ```bash
    git remote add mast-admin git@github.com:danielwii/mast-admin.git
    git subtree add --prefix mast-admin mast-admin master
    ```

2. Update.
    ```bash
    git subtree pull --prefix mast-admin mast-admin master
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
