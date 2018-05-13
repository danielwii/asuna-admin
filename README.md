# Asuna-Admin

[![travis-ci](https://travis-ci.org/danielwii/asuna-admin.svg?branch=master)](https://travis-ci.org/danielwii/asuna-admin)
[![codecov](https://codecov.io/gh/danielwii/asuna-admin/branch/master/graph/badge.svg)](https://codecov.io/gh/danielwii/asuna-admin)
[![Maintainability](https://api.codeclimate.com/v1/badges/b140ae8b66b0d6f3e907/maintainability)](https://codeclimate.com/github/danielwii/asuna-admin/maintainability)

[![Daniel Wei](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-Daniel%20Wei-ff0000.svg)](https://github.com/danielwii)

[changelog](https://github.com/danielwii/asuna-admin/blob/master/CHANGELOG.md)

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

## Test

### typescript & babel 7 support

* plugins: 

    * https://github.com/bernardmcmanus/babel-plugin-async-import
    
* issues
    
    * https://github.com/kulshekhar/ts-jest/pull/512

```bash
yarn add -D babel-core@^7.0.0-bridge.0
# temporary solve ts-jest not support babel 7 issue till v22.4.6
yarn add -D joaovieira/ts-jest#babel-peerDependency-release
```

```json
// add jest config to package.json
{
  "jest": {
    "globals": {
      "ts-jest": {
        "babelConfig": {
          "plugins": [
            ["babel-plugin-async-import"]
          ]
        },
        "tsConfigFile": "tsconfig.jest.json"
      }
    },
    "testRegex": ".spec.tsx?$",
    "transform": {
      "^.+\\.(t|j)sx?$": "ts-jest"
    }
  }
}
```

[You can't use "jsx": "preserve" int tsconfig for now.](https://github.com/bernardmcmanus/babel-plugin-async-import)

```json
// tsconfig.jest.json
{
  "extends": "./tsconfig",
  "compilerOptions": {
    "jsx": "react"
  }
}
```
