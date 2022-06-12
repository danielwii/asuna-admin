import { AppContext } from '../core/context';
import { createLogger } from '../logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IAuthService {
  login(username: string, password: string): Promise<any>;

  logout(): Promise<any>;

  extractToken(payload: string | object): string | undefined;
}

export interface IAuthProxy {
  login(username: string, password: string): Promise<any>;

  logout(): Promise<any>;

  extractToken(payload: string | object): string;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:auth');

export const authProxy: IAuthProxy = {
  login: (username, password) => AppContext.ctx.auth.login(username, password),
  logout: () => AppContext.ctx.auth.logout(),
  extractToken: (payload) => AppContext.ctx.auth.extractToken(payload),
};

export class AuthAdapter implements IAuthProxy {
  private service: IAuthService;

  constructor(service: IAuthService) {
    this.service = service;
  }

  login = (username, password) => this.service.login(username, password);
  logout = () => this.service.logout();
  extractToken = (payload) => {
    const token = this.service.extractToken(payload);
    if (!token) {
      logger.warn('[extractToken]', 'extract token error from', payload);
      throw new Error('extract token error from response');
    }
    return token;
  };
}
