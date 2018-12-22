# Asuna-Admin

[![travis-ci](https://travis-ci.org/danielwii/asuna-admin.svg?branch=master)](https://travis-ci.org/danielwii/asuna-admin)
[![codecov](https://codecov.io/gh/danielwii/asuna-admin/branch/master/graph/badge.svg)](https://codecov.io/gh/danielwii/asuna-admin)
[![Maintainability](https://api.codeclimate.com/v1/badges/b140ae8b66b0d6f3e907/maintainability)](https://codeclimate.com/github/danielwii/asuna-admin/maintainability)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdanielwii%2Fasuna-admin?ref=badge_shield)

[![Daniel Wei](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-Daniel%20Wei-ff0000.svg)](https://github.com/danielwii)

## Why Asuna-Admin

A contract-first admin for developers is necessary for any different server languages.

## Develop

0.9.0 版本开始整个项目已经完成了组件化改造，不再需要通过 clone/subtree 的方式进行开发，当然，继续使用也可以。

## Not Really Quick Start

- add service/register.ts

```typescript
import { AuthService } from './auth';
import { ModelService } from './model';
import { MenuService } from './menu';
import { ApiService } from './api';
import { SecurityService } from './security';
import { definitions } from './definitions';

import { Config, IIndexRegister, ILoginRegister } from '@asuna-admin';

Config.update({});

export const register: ILoginRegister & IIndexRegister = {
  definitions,
  authService: new AuthService(),
  modelService: new ModelService(),
  menuService: new MenuService(),
  apiService: new ApiService(),
  securityService: new SecurityService(),
};
```

- add pages/index.ts

```typescript
import { renderIndexPage } from '@asuna-admin';
import getConfig from 'next/config';
import { register } from '../services/register';

export default renderIndexPage({ register }, getConfig());
```

- add pages/login.ts

```typescript
import { renderLoginPage } from '@asuna-admin';
import getConfig from 'next/config';
import { register } from '../services/register';

export default renderLoginPage({ register }, getConfig());
```
