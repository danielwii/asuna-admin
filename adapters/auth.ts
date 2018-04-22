import { createLogger, lv } from '../helpers';
import { appContext }       from '../app/context';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IAuthService {
  login(params: { body: { username: string, password: string } }): Promise<any>;

  logout(): Promise<any>;

  extractToken(payload: object): string | undefined;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:auth', lv.warn);

export const authProxy = {
  login       : args => appContext.ctx.auth.login(args),
  logout      : () => appContext.ctx.auth.logout(),
  extractToken: (payload: object) => appContext.ctx.auth.extractToken(payload),
};

export class AuthAdapter {
  constructor(private service: IAuthService) {
  }

  login        = args => this.service.login(args);
  logout       = () => this.service.logout();
  extractToken = (payload: object) => {
    const token = this.service.extractToken(payload);
    if (!token) {
      logger.warn('[extractToken]', 'extract token error from', payload);
      throw new Error('extract token error from response');
    }
    return token;
  };
}
