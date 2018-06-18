import { appContext } from '../app/context';
import { createLogger } from '../helpers/logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IAuthService {
  login(username: string, password: string): Promise<any>;

  logout(): Promise<any>;

  extractToken(payload: string | object): string | undefined;
}

interface IAuthProxy {
  login(username: string, password: string): Promise<any>;

  logout(): Promise<any>;

  extractToken(payload: string | object): string;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:auth', 'warn');

export const authProxy: IAuthProxy = {
  login: (username, password) => appContext.ctx.auth.login(username, password),
  logout: () => appContext.ctx.auth.logout(),
  extractToken: payload => appContext.ctx.auth.extractToken(payload),
};

export class AuthAdapter implements IAuthProxy {
  private service: IAuthService;

  constructor(service: IAuthService) {
    this.service = service;
  }

  login = (username, password) => this.service.login(username, password);
  logout = () => this.service.logout();
  extractToken = payload => {
    const token = this.service.extractToken(payload);
    if (!token) {
      logger.warn('[extractToken]', 'extract token error from', payload);
      throw new Error('extract token error from response');
    }
    return token;
  };
}
