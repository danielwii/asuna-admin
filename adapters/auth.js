export const jwtAuthProxy = {
  login: (username, password) => global.context.auth.login(username, password),
};

export const basicAuthAdapter = {};

export class JwtAuthAdapter {
  constructor(service) {
    this.service = service;
  }

  login = (username, password) => this.service.login(username, password)
}
