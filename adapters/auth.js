export const authProxy = {
  login       : (username, password) => global.context.auth.login(username, password),
  logout      : () => global.context.auth.logout(),
  extractToken: response => global.context.auth.extractToken(response),
};

export class AuthAdapter {
  constructor(service) {
    this.service = service;
  }

  login        = (username, password) => this.service.login(username, password);
  logout       = () => this.service.logout();
  extractToken = response => this.service.extractToken(response)
}
