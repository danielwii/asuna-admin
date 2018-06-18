import { responseToUrl } from '../helpers/upload';

export type StringCase = 'None' | 'Snake' | 'Camel';

export type ApiResponsePageMode = 'SQLAlchemy' | 'SpringJPA' | 'Default';

export type ApiResponseAssociationMode = 'ids' | 'entity';

export type AuthHeader =
  /**
   * header: Authorization: token
   * default
   */
  | 'AuthHeader'
  /**
   * header: Authorization: `Bearer ${token}`
   */
  | 'AuthHeaderAsBearerToken';

interface ConfigOpts {
  MODEL_KEYS_CASE?: StringCase;
  MODEL_NAME_CASE?: StringCase;
  AUTH_HEADER?: AuthHeader;
  API_RESPONSE_PAGE_MODE?: ApiResponsePageMode;
  API_RESPONSE_ASSOCIATION_MODE?: ApiResponseAssociationMode;
  /**
   * 默认返回 table 的页面大小
   * @type {string}
   */
  DEFAULT_PAGE_SIZE?: number;
  /**
   * 可以理解为不会被存入数据库的前缀
   */
  IMAGE_HOST?: string;
  /**
   * 将被存入数据库的前缀
   */
  IMAGE_PREFIX?: string;
  VIDEO_HOST?: string;
  VIDEO_PREFIX?: string;
  ATTACHES_HOST?: string;
  ATTACHES_PREFIX?: string;
  // --------------------------------------------------------------
  // 定义特定的资源 url 处理函数
  // --------------------------------------------------------------
  IMAGE_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;
  VIDEO_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;
  ATTACHES_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;
}

const defaultConfiguration: ConfigOpts = {
  MODEL_KEYS_CASE: 'None',
  MODEL_NAME_CASE: 'None',
  AUTH_HEADER: 'AuthHeaderAsBearerToken',
  API_RESPONSE_PAGE_MODE: 'Default',

  /**
   * 配置关联数据返回的是 id 还是 entity，默认是 ID 模式
   */
  API_RESPONSE_ASSOCIATION_MODE: 'ids',
  DEFAULT_PAGE_SIZE: 25,
  IMAGE_HOST: '/',
  IMAGE_PREFIX: 'uploads/images',
  VIDEO_HOST: '/',
  VIDEO_PREFIX: 'uploads/videos',
  ATTACHES_HOST: '/',
  ATTACHES_PREFIX: 'uploads/attaches',
  IMAGE_RES_HANDLER: responseToUrl,
  VIDEO_RES_HANDLER: responseToUrl,
  ATTACHES_RES_HANDLER: responseToUrl,
};

class Config {
  opts = defaultConfiguration;

  update(opts: ConfigOpts = {}): void {
    this.opts = Object.assign(this.opts, opts);
  }

  get<K extends keyof ConfigOpts>(key: K, defaultValue?): ConfigOpts[K] {
    return this.opts[key] || defaultValue;
  }

  is<K extends keyof ConfigOpts>(key: K, value: ConfigOpts[K]): boolean {
    // console.log({ opts: this.opts, key, value, result: this.opts[key] === value });
    return this.opts[key] === value;
  }
}

const config = new Config();

export { config };
