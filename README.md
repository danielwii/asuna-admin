# Asuna-Admin

[![travis-ci](https://travis-ci.org/danielwii/asuna-admin.svg?branch=master)](https://travis-ci.org/danielwii/asuna-admin)
[![codecov](https://codecov.io/gh/danielwii/asuna-admin/branch/master/graph/badge.svg)](https://codecov.io/gh/danielwii/asuna-admin)
[![Maintainability](https://api.codeclimate.com/v1/badges/b140ae8b66b0d6f3e907/maintainability)](https://codeclimate.com/github/danielwii/asuna-admin/maintainability)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin?ref=badge_shield)

[![Daniel Wei](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-Daniel%20Wei-ff0000.svg)](https://github.com/danielwii)

[changelog](https://github.com/danielwii/asuna-admin/blob/master/CHANGELOG.md)

## Develop

0.9.0 版本开始整个项目已经完成了组件化改造，不再需要通过 clone/subtree 的方式进行开发。

## Quick Start

## Config

## Test

### typescript & babel 7 support

#### plugins:

- https://github.com/bernardmcmanus/babel-plugin-async-import

#### issues

- You can't use {"jsx": "preserve"} in tsconfig for now.

  ```json
  // tsconfig.jest.json
  {
    "extends": "./tsconfig",
    "compilerOptions": {
      "jsx": "react"
    }
  }
  ```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin?ref=badge_large)
