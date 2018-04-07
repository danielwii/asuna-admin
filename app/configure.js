export const StringCase = {
  None : 'None',
  Snake: 'snake',
  Camel: 'Camel',
};

export const ApiResponsePageMode = {
  SQLAlchemy: 'SQLAlchemy',
  SpringJPA : 'SpringJPA',
  Default   : 'Default',
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
  MODEL_KEYS_CASE       : StringCase.none,
  AUTH_HEADER           : AuthHeader.AuthHeaderAsBearerToken,
  API_RESPONSE_PAGE_MODE: ApiResponsePageMode.Default,
};

class Config {
  opts = defaultConfiguration;

  update(opts = {}) {
    this.opts = Object.assign(this.opts, opts);
  }

  get(key, defaultValue?) {
    return this.opts[key] || defaultValue;
  }

  is(key, value) {
    return this.opts[key] === value;
  }
}

const config = new Config();

export default config;
