import * as _ from 'lodash';

import { Config } from '../config';
import { AppContext } from '../core/context';

import type { PaginationConfig } from 'antd/es/pagination';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { IAuthProxy } from '../adapters/auth';
import type { Asuna } from '../types/asuna';
import type { IRequestConfig } from './security';

export const securityProxy = {
  currentUser(configs?: IRequestConfig): Promise<AxiosResponse> {
    return AppContext.ctx.security.currentUser(configs);
  },

  roles(configs?: IRequestConfig): Promise<AxiosResponse> {
    return AppContext.ctx.security.roles(configs);
  },

  updatePassword(
    data: { body: { username: string; email: string; password: string } },
    configs?: IRequestConfig,
  ): Promise<AxiosResponse> {
    return AppContext.ctx.security.updatePassword(data, configs);
  },
};

export const apiProxy = {
  upload: (
    file,
    options: { bucket?: string; prefix?: string } = {},
    requestConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Asuna.Schema.UploadResponse[]>> => {
    if (Config.get('CLIENT_GEN_UPLOADER_PREFIX')) {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}/${now.getMonth() + 1}`;
      _.assign(options, { prefix: `fixed/${yearMonth}` });
    }
    return AppContext.ctx.api.upload(file, options, requestConfig);
  },
  getVersion: (): Promise<AxiosResponse> => AppContext.ctx.api.getVersion(),
  acquireOperationToken: (service: string): Promise<AxiosResponse> => AppContext.ctx.api.acquireOperationToken(service),
  useOperationToken: (token: string): Promise<AxiosResponse> => AppContext.ctx.api.useOperationToken(token),
  releaseOperationToken: (token: string): Promise<AxiosResponse> => AppContext.ctx.api.releaseOperationToken(token),
  getExcelModel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.getExcelModel(auth, data, options),
  importExcel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.importExcel(auth, data, options),
  exportExcel: (auth, data, options): Promise<AxiosResponse> => AppContext.ctx.api.exportExcel(auth, data, options),
  destroyKv: (data): Promise<AxiosResponse> => AppContext.ctx.api.destroyKv(data),
};

export const authProxy: IAuthProxy = {
  login: (username, password) => AppContext.ctx.auth.login(username, password),
  logout: () => AppContext.ctx.auth.logout(),
  extractToken: (payload) => AppContext.ctx.auth.extractToken(payload),
};

export const menuProxy = {
  init: (isSysAdmin, authorities) => AppContext.ctx.menu.init(isSysAdmin, authorities),
  getSideMenus: () => AppContext.ctx.menu.getSideMenus(),
};

export const responseProxy = {
  extract(apiResponse?: object): { items: object[]; pagination: PaginationConfig } {
    return AppContext.ctx.response.extract(apiResponse || {});
  },
};
