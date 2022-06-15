import { AxiosResponse } from 'axios';

import { createLogger } from '../logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IRequestConfig {
  endpoint?: string;
}

export interface ISecurityService {
  currentUser(configs?: IRequestConfig): Promise<AxiosResponse>;

  roles(configs?: IRequestConfig): Promise<AxiosResponse>;

  updatePassword(
    data: { body: { username: string; email: string; password: string } },
    configs?: IRequestConfig,
  ): Promise<AxiosResponse>;
}

export class Role {}

export interface SecurityAdapter {
  roles(configs?: IRequestConfig): Promise<Role[]>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:security');

export class SecurityAdapterImpl {
  private service: ISecurityService;

  constructor(service: ISecurityService) {
    this.service = service;
  }

  currentUser = (configs?: IRequestConfig) => {
    return this.service.currentUser(configs);
  };

  roles = (configs?: IRequestConfig) => {
    return this.service.roles(configs);
  };

  updatePassword = (
    data: { body: { username: string; email: string; password: string } },
    configs?: IRequestConfig,
  ) => {
    return this.service.updatePassword(data, configs);
  };
}
