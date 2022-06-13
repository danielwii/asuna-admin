import { AxiosResponse } from 'axios';

import { Store } from '../core/store';
import { createLogger } from '../logger';

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
    const auth = Store.fromStore('auth');
    return this.service.currentUser(auth, configs);
  };

  roles = (configs?: IRequestConfig) => {
    const auth = Store.fromStore('auth');
    return this.service.roles(auth, configs);
  };

  updatePassword = (
    data: { body: { username: string; email: string; password: string } },
    configs?: IRequestConfig,
  ) => {
    const auth = Store.fromStore('auth');
    return this.service.updatePassword(auth, data, configs);
  };
}
