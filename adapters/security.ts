import { createLogger }   from 'helpers';
import { IRequestConfig } from './interface';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

interface CurrentUserParams {
  opts: { token: string },
  config: IRequestConfig
}

interface RolesParams {
  opts: { token: string },
  config: IRequestConfig
}

interface UpdatePasswordParams {
  opts: { token: string },
  data: { body: { email: string, password: string } },
  config: IRequestConfig,
}

export interface ISecurityService {
  currentUser(params: CurrentUserParams): any,

  roles(params: RolesParams): any,

  updatePassword(params: UpdatePasswordParams): any,
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
const logger = createLogger('adapters:security');

export const securityProxy = {
  currentUser   : args => global.context.security.currentUser(args),
  roles         : args => global.context.security.roles(args),
  updatePassword: args => global.context.security.updatePassword(args),
};

export class SecurityAdapter {
  constructor(private service: ISecurityService) {
  }

  currentUser    = args => this.service.currentUser(args);
  roles          = args => this.service.roles(args);
  updatePassword = args => this.service.updatePassword(args);
}
