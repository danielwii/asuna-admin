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

### Using subtree

1. Create
    ```bash
    git remote add mast-admin git@github.com:danielwii/mast-admin.git
    git subtree add --prefix mast-admin mast-admin master
    ```

2. Update.
    ```bash
    git subtree pull --prefix mast-admin mast-admin master
    ```
