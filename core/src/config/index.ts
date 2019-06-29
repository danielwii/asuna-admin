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
   * 默认的页面排序，'byPrimaryKey' or fields
   */
  TABLE_DEFAULT_ORDER_BY?: 'byPrimaryKey' | 'createdAt' | 'updatedAt' | string;

  /**
   * 默认返回 table 的页面大小
   * @type {string}
   */
  DEFAULT_PAGE_SIZE?: number;
  UPLOADS_ENDPOINT?: string;
  /**
   * 可以理解为不会被存入数据库的前缀
   */
  // IMAGE_HOST?: string;
  /**
   * 将被存入数据库的前缀
   */
  IMAGE_BUCKET?: string;
  IMAGE_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;

  // VIDEO_HOST?: string;
  VIDEO_BUCKET?: string;
  VIDEO_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;

  // FILE_HOST?: string;
  FILE_BUCKET?: string;
  FILE_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;

  // ATTACHE_HOST?: string;
  ATTACHE_BUCKET?: string;
  // --------------------------------------------------------------
  // 定义特定的资源 url 处理函数
  // --------------------------------------------------------------
  ATTACHE_RES_HANDLER?: (res: Asuna.Schema.UploadResponse) => string;

  GRAPHQL_HOST?: string;
}

const defaultConfiguration: ConfigOpts = {
  MODEL_KEYS_CASE: 'None',
  MODEL_NAME_CASE: 'None',
  AUTH_HEADER: 'AuthHeaderAsBearerToken',
  API_RESPONSE_PAGE_MODE: 'Default',

  TABLE_DEFAULT_ORDER_BY: 'byPrimaryKey',

  API_RESPONSE_ASSOCIATION_MODE: 'ids',
  DEFAULT_PAGE_SIZE: 25,

  UPLOADS_ENDPOINT: 'uploads/',
  // IMAGE_HOST: 'uploads/',
  IMAGE_BUCKET: 'default',
  IMAGE_RES_HANDLER: responseToUrl,

  // VIDEO_HOST: 'uploads/',
  VIDEO_BUCKET: 'videos',
  VIDEO_RES_HANDLER: responseToUrl,

  // ATTACHE_HOST: 'uploads/',
  ATTACHE_BUCKET: 'attaches',
  ATTACHE_RES_HANDLER: responseToUrl,

  // FILE_HOST: 'uploads/',
  FILE_BUCKET: 'files',
  FILE_RES_HANDLER: responseToUrl,
};

export class Config {
  static opts = defaultConfiguration;
  static isServer = typeof window === 'undefined';

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
