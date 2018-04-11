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

export const ApiResponseAssociationMode = {
  ID    : 'ids',
  ENTITY: 'entity',
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
  MODEL_KEYS_CASE              : 'MODEL_KEYS_CASE',
  AUTH_HEADER                  : 'AUTH_HEADER',
  API_RESPONSE_ASSOCIATION_MODE: 'API_RESPONSE_ASSOCIATION_MODE',
};

const defaultConfiguration = {
  MODEL_KEYS_CASE              : StringCase.none,
  AUTH_HEADER                  : AuthHeader.AuthHeaderAsBearerToken,
  API_RESPONSE_PAGE_MODE       : ApiResponsePageMode.Default,
  /**
   * 配置关联数据返回的是 id 还是 entity，默认是 ID 模式
   */
  API_RESPONSE_ASSOCIATION_MODE: ApiResponseAssociationMode.ID,
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
    // console.log({ opts: this.opts, key, value, result: this.opts[key] === value });
    return this.opts[key] === value;
  }
}

const config = new Config();

export { config };
