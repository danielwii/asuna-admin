export const jwtAuthAdapter = {
  login: (username, password) => global.context.auth.login(username, password),
};

export const basicAuthAdapter = {};
