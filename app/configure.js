export const StringCase = {
  None : 'None',
  Snake: 'snake',
  Camel: 'Camel',
};

export const AuthHeader = {
  /**
   * header: Authorization: token
   * default
   */
  AuthHeader             : 'AuthHeader',
  /**
   * header: Authorization: `Bearer ${token}`
   */
  AuthHeaderAsBearerToken: 'AuthHeaderAsBearerToken',
};

export const ConfigKeys = {
  MODEL_KEYS_CASE: 'MODEL_KEYS_CASE',
  AUTH_HEADER    : 'AUTH_HEADER',
};

const defaultConfiguration = {
  MODEL_KEYS_CASE: StringCase.none,
  AUTH_HEADER    : AuthHeader.AuthHeaderAsBearerToken,
};

export default class Config {
  constructor(opts = {}) {
    this.opts = Object.assign(defaultConfiguration, opts);
  }

  get(key, defaultValue?) {
    return this.opts[key] || defaultValue;
  }

  is(key, value) {
    return this.opts[key] === value;
  }
}
