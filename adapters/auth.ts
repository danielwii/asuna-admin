import { createLogger, lv } from 'helpers';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IAuthService {
  login(body: { username: string, password: string }): void;

  logout(): void;

  extractToken(payload): string;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:auth', lv.warn);

export const authProxy = {
  login       : args => global.context.auth.login(args),
  logout      : () => global.context.auth.logout(),
  extractToken: args => global.context.auth.extractToken(args),
};

export class AuthAdapter {
  constructor(private service: IAuthService) {
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
