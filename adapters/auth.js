// @flow
import { createLogger } from '../helpers';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

declare type LoginParams = { body: { username: string, password: string } }

declare var ExtractToken: any;

export interface IAuthService {
  login: LoginParams => any,
  logout: () => any,
  extractToken: ExtractToken => string,
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
const logger = createLogger('adapters:auth');

export const authProxy: IAuthService = {
  login       : args => global.context.auth.login(args),
  logout      : () => global.context.auth.logout(),
  extractToken: args => global.context.auth.extractToken(args),
};

export class AuthAdapter implements IAuthService {
  service: IAuthService;

  constructor(service: IAuthService) {
    this.service = service;
  }

  login        = args => this.service.login(args);
  logout       = () => this.service.logout();
  extractToken = (payload) => {
    const token = this.service.extractToken(payload);
    if (!token) {
      logger.warn('[extractToken]', 'extract token error from', payload);
      throw new Error('extract token error from response');
    }
    return token;
  };
}
