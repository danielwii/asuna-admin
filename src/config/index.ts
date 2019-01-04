import { responseToUrl } from './upload';

type StringCase = 'None' | 'Snake' | 'Camel';

type ApiResponsePageMode = 'SQLAlchemy' | 'SpringJPA' | 'Default';

/**
 * 定义服务端 API 返回的对应格式
 * - ids 返回 id 列表
 * - entity 返回实体信息，尽量不应该使用该模式，会产生过多的加载数据
 */
type ApiResponseAssociationMode = 'ids' | 'entity';

type AuthHeader =
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

export class Config {
  static opts = defaultConfiguration;

  static update(opts: ConfigOpts = {}): void {
    Config.opts = Object.assign(Config.opts, opts);
  }

  static get<K extends keyof ConfigOpts>(key: K, defaultValue?): ConfigOpts[K] {
    return Config.opts[key] || defaultValue;
  }

  static is<K extends keyof ConfigOpts>(key: K, value: ConfigOpts[K]): boolean {
    // console.log({ opts: Config.opts, key, value, result: Config.opts[key] === value });
    return Config.opts[key] === value;
  }
}
