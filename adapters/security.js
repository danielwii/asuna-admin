// @flow

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

type CurrentUserParams = {
  opts: { token: string },
  pathVariable: { id: string },
  config: IRequestConfig
}

type RolesParams = {
  opts: { token: string },
  config: IRequestConfig
}

type UpdatePasswordParams = {
  opts: { token: string },
  data: { body: { email: string, password: string } },
  config: IRequestConfig,
}

export interface ISecurityService {
  currentUser: CurrentUserParams => any,
  roles: RolesParams => any,
  updatePassword: UpdatePasswordParams => any,
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

export const securityProxy: ISecurityService = {
  currentUser   : args => global.context.auth.currentUser(args),
  roles         : args => global.context.auth.roles(args),
  updatePassword: args => global.context.auth.updatePassword(args),
};

export class SecurityAdapter implements ISecurityService {
  service: ISecurityService;

  constructor(service: ISecurityService) {
    this.service = service;
  }

  currentUser    = args => this.service.currentUser(args);
  roles          = args => this.service.roles(args);
  updatePassword = args => this.service.updatePassword(args);
}
