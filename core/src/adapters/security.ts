import { AxiosResponse } from 'axios';

import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IRequestConfig {
  endpoint?: string;
}

export interface ISecurityService {
  currentUser(opts: { token: string | null }, configs?: IRequestConfig): Promise<AxiosResponse>;

  roles(opts: { token: string | null }, configs?: IRequestConfig): Promise<AxiosResponse>;

  updatePassword(
    opts: { token: string | null },
    data: { body: { email: string; password: string } },
    configs?: IRequestConfig,
  ): Promise<AxiosResponse>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:security');

export const securityProxy = {
  currentUser(configs?: IRequestConfig): Promise<AxiosResponse> {
    return AppContext.ctx.security.currentUser(configs);
  },

  roles(configs?: IRequestConfig): Promise<AxiosResponse> {
    return AppContext.ctx.security.roles(configs);
  },

  updatePassword(
    data: { body: { email: string; password: string } },
    configs?: IRequestConfig,
  ): Promise<AxiosResponse> {
    return AppContext.ctx.security.updatePassword(data, configs);
  },
};

export class SecurityAdapter {
  private service: ISecurityService;

  constructor(service: ISecurityService) {
    this.service = service;
  }

  currentUser = (configs?: IRequestConfig) => {
    const auth = AppContext.fromStore('auth');
    return this.service.currentUser(auth, configs);
  };

  roles = (configs?: IRequestConfig) => {
    const auth = AppContext.fromStore('auth');
    return this.service.roles(auth, configs);
  };

  updatePassword = (
    data: { body: { email: string; password: string } },
    configs?: IRequestConfig,
  ) => {
    const auth = AppContext.fromStore('auth');
    return this.service.updatePassword(auth, data, configs);
  };
}
