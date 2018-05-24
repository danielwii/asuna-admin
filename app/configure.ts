export const enum StringCase {
  None = 'None',
  Snake = 'Snake',
  Camel = 'Camel',
}

export const enum ApiResponsePageMode {
  SQLAlchemy = 'SQLAlchemy',
  SpringJPA = 'SpringJPA',
  Default = 'Default',
}

export const enum ApiResponseAssociationMode {
  ID = 'ids',
  ENTITY = 'entity',
}

export const enum AuthHeader {
  /**
   * header: Authorization: token
   * default
   */
  AuthHeader = 'AuthHeader',
  /**
   * header: Authorization: `Bearer ${token}`
   */
  AuthHeaderAsBearerToken = 'AuthHeaderAsBearerToken',
}

export const enum ConfigKey {
  MODEL_KEYS_CASE = 'MODEL_KEYS_CASE',
  MODEL_NAME_CASE = 'MODEL_NAME_CASE',
  AUTH_HEADER = 'AUTH_HEADER',

  API_RESPONSE_PAGE_MODE = 'API_RESPONSE_PAGE_MODE',
  API_RESPONSE_ASSOCIATION_MODE = 'API_RESPONSE_ASSOCIATION_MODE',

  IMAGE_API = 'IMAGE_API',
  VIDEO_API = 'VIDEO_API',

  /**
   * 默认返回 table 的页面大小
   * @type {string}
   */
  DEFAULT_PAGE_SIZE = 'DEFAULT_PAGE_SIZE',
}

interface ConfigOpts {
  MODEL_KEYS_CASE?: StringCase;
  MODEL_NAME_CASE?: StringCase;
  AUTH_HEADER?: AuthHeader;
  API_RESPONSE_PAGE_MODE?: ApiResponsePageMode;
  API_RESPONSE_ASSOCIATION_MODE?: ApiResponseAssociationMode;
  IMAGE_API?: string;
  VIDEO_API?: string;
  DEFAULT_PAGE_SIZE?: number;
}

const defaultConfiguration: ConfigOpts = {
  MODEL_KEYS_CASE: StringCase.None,
  MODEL_NAME_CASE: StringCase.None,
  AUTH_HEADER: AuthHeader.AuthHeaderAsBearerToken,
  API_RESPONSE_PAGE_MODE: ApiResponsePageMode.Default,
  /**
   * 配置关联数据返回的是 id 还是 entity，默认是 ID 模式
   */
  API_RESPONSE_ASSOCIATION_MODE: ApiResponseAssociationMode.ID,
  DEFAULT_PAGE_SIZE: 25,
};

class Config {
  opts = defaultConfiguration;

  update(opts: ConfigOpts = {}) {
    this.opts = Object.assign(this.opts, opts);
  }

  get(key: ConfigKey, defaultValue?) {
    return this.opts[key] || defaultValue;
  }

  is(key: ConfigKey, value) {
    // console.log({ opts: this.opts, key, value, result: this.opts[key] === value });
    return this.opts[key] === value;
  }
}

const config = new Config();

export { config };
