import {
  AdminAdapter,
  AdminAdapterImpl,
  ApiAdapterImpl,
  AuthAdapter,
  IAdminService,
  IApiService,
  IAuthService,
  IModelService,
  ISecurityService,
  MenuAdapter,
  ModelAdapterImpl,
  ResponseAdapter,
  SecurityAdapterImpl,
  WsAdapter,
} from '@asuna-admin/adapters';
import { GraphqlAdapterImpl, KeyValueModelVo } from '@asuna-admin/adapters/graphql';
import { GroupFormKVComponent } from '@asuna-admin/components';
import { ListKVComponent } from '@asuna-admin/components/KV/list';
import { Config } from '@asuna-admin/config';
import { AsunaDefinitions } from '@asuna-admin/core/definitions';
import { AuthState, IStoreConnector, RootState } from '@asuna-admin/store';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import * as React from 'react';
import { AnyAction, Dispatch } from 'redux';
import { Subject } from 'rxjs';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IComponentService {
  regGraphql: (componentName: string, renderComponent: React.FC) => void;
  load: (componentName: string) => React.FC;
}

export interface ILoginRegister {
  createAuthService(): IAuthService;
}

export interface IIndexRegister extends ILoginRegister {
  createAuthService(): IAuthService;

  modelService: IModelService;

  // createMenuService(): IMenuService;

  createApiService(): IApiService;

  createAdminService(): IAdminService;

  createSecurityService(): ISecurityService;

  definitions: AsunaDefinitions;

  componentService: IComponentService;
}

export type LoginModuleRegister = {
  module: 'login';
  register: ILoginRegister;
};

export type IndexModuleRegister = {
  module: 'index';
  register: IIndexRegister;
};

export interface INextConfig {
  serverRuntimeConfig: {};
  publicRuntimeConfig?: { env?: string; version?: string };
}

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

class AppContext {
  private static INSTANCE: AppContext;

  private static nextConfig: INextConfig = {
    serverRuntimeConfig: {},
    publicRuntimeConfig: { env: 'canary' },
  };

  private static _context: {
    auth: AuthAdapter;
    response: ResponseAdapter;
    menu: MenuAdapter;
    api: ApiAdapterImpl;
    admin: AdminAdapter;
    security: SecurityAdapterImpl;
    models: ModelAdapterImpl;
    ws: WsAdapter;
    components: IComponentService;
    graphql: GraphqlAdapterImpl;
  };

  /**
   * 提供一种脱离 redux-connect 调用 dispatch 的方式
   */
  private static _dispatch: Dispatch;
  private static _subject;
  private static _constants;
  private static _stateMachines;
  private static _isServer = typeof window === 'undefined';
  private static _storeConnector: IStoreConnector<RootState>;

  static serverSettings: object;
  static kvModels: KeyValueModelVo[];

  public static init(nextConfig?: INextConfig) {
    if (nextConfig) {
      AppContext.nextConfig = nextConfig;
    }
    if (!AppContext._subject) {
      AppContext._subject = new Subject();
    }
    // this._subject.subscribe({
    //   next: (action) => console.log('observer: ', action)
    // });
    if (!AppContext._storeConnector) {
      const { storeConnector } = require('../store');
      AppContext._storeConnector = storeConnector;
    }

    if (!this.INSTANCE) {
      this.INSTANCE = new AppContext();
    }
  }

  constructor() {}

  static get instance() {
    return AppContext.INSTANCE;
  }

  public static regStore(storeConnector: IStoreConnector<RootState>, initialState?: object, force?: boolean) {
    if (!AppContext._storeConnector || force) {
      AppContext._storeConnector = storeConnector;
      if (initialState) {
        storeConnector.connect(initialState);
      }
    }
  }

  public static regDispatch(dispatch: Dispatch): void {
    if (!AppContext._dispatch) AppContext._dispatch = dispatch;
  }

  public static dispatch(action: AnyAction) {
    !AppContext.isServer && AppContext._dispatch && AppContext._dispatch(action);
  }

  public static actionHandler(action: AnyAction) {
    !AppContext.isServer && AppContext._subject && AppContext._subject.next(action);
  }

  /**
   * 提供全局的注册方法
   * @param {ILoginRegister & IIndexRegister} moduleRegister
   */
  public static async setup(moduleRegister: ILoginRegister & IIndexRegister): Promise<void>;
  /**
   * 提供基于模块的注册方法
   * @param {LoginModuleRegister | IndexModuleRegister} moduleRegister
   */
  public static async setup(moduleRegister: LoginModuleRegister | IndexModuleRegister): Promise<void>;
  public static async setup(moduleRegister): Promise<void> {
    if (moduleRegister.module) {
      const register = moduleRegister.register;

      if (moduleRegister.module === 'login') {
        AppContext._context = {
          ...AppContext._context,
          auth: new AuthAdapter(register.createAuthService()),
          ws: new WsAdapter(),
        };
      } else {
        await this.registerIndex(register, 'index').catch(console.error);
      }
    } else {
      await this.registerIndex(moduleRegister).catch(console.error);
    }
  }

  public static set isServer(isServer: boolean | undefined) {
    AppContext._isServer = !!isServer;
  }

  public static set constants(constants: any) {
    this._constants = constants;
  }

  public static set stateMachines(stateMachines: any) {
    this._stateMachines = stateMachines;
  }

  public static get isServer() {
    return AppContext._isServer;
  }

  /**
   * 开发模式，生产中无法激活
   */
  public static get isDevMode() {
    return this.isDebugMode || AppContext.nextConfig.publicRuntimeConfig?.env !== 'production';
  }

  /**
   * 调试模式，生产中也可以激活
   */
  public static get isDebugMode() {
    return (global as any).DEBUG_MODE;
  }

  public static get publicConfig() {
    return AppContext.nextConfig.publicRuntimeConfig || {};
  }

  public static get ctx() {
    return AppContext._context;
  }

  public static get store() {
    return AppContext._storeConnector;
  }

  public static get subject() {
    return AppContext._subject;
  }

  public static get adapters() {
    return AppContext._context;
  }

  public static get constants() {
    return AppContext._constants;
  }

  public static get stateMachines() {
    return AppContext._stateMachines;
  }

  public static async syncSettings() {
    const settings = await AppContext.ctx.graphql.loadSystemSettings();
    if (settings) {
      this.serverSettings = Object.assign({}, ...settings.map((setting) => ({ [setting.key]: setting })));
    }

    const constants = await AppContext.ctx.graphql.loadKv('app.settings', 'constants');
    if (constants) this.constants = constants.value;

    const stateMachines = await AppContext.ctx.admin.stateMachines();
    if (stateMachines) this.stateMachines = stateMachines;

    const kvModels = await AppContext.ctx.graphql.loadKvModels();
    if (kvModels) this.kvModels = kvModels;
  }

  /**
   * 提供了直接通过 redux-store 获取数据的 api
   * @param state
   */
  public static fromStore<K extends keyof RootState>(state: K): RootState[K] {
    if (this.store && this.store.getState) {
      return this.store.getState(state);
    }
    console.error('store is not available or getState not defined on state.');
    return {} as any;
  }

  public static withAuth<T>(func: (auth: AuthState) => T): T {
    return func(AppContext.fromStore('auth'));
  }

  private static async registerIndex(register: IIndexRegister, module?: 'index'): Promise<void> {
    AppContext._context = {
      ...AppContext._context,
      auth: new AuthAdapter(register.createAuthService()),
      response: new ResponseAdapter(),
      api: new ApiAdapterImpl(register.createApiService()),
      security: new SecurityAdapterImpl(register.createSecurityService()),
      models: new ModelAdapterImpl(register.modelService, register.definitions),
      ws: new WsAdapter(),
      components: register.componentService,
      admin: new AdminAdapterImpl(register.createAdminService()),
      graphql: new GraphqlAdapterImpl(Config.get('GRAPHQL_HOST')),
    };

    // only setup menu in index page
    if (module === 'index') {
      await this.syncSettings();

      // --------------------------------------------------------------
      // 将 kv 压入 admin menus
      // --------------------------------------------------------------

      const adminMenu = register.definitions.sideMenus.find(_.matches({ key: 'admin' }));
      if (adminMenu) {
        const adminKvModels = AppContext.kvModels.filter(fp.get('formatType'));
        adminKvModels.forEach((model) => {
          const componentName = `${model.pair.collection}#${model.pair.key}`;
          register.componentService.regGraphql(componentName, (props) =>
            model.formatType === 'KVGroupFieldsValue' ? (
              // KVGroupFieldsValue
              <GroupFormKVComponent kvCollection={model.pair.collection} kvKey={model.pair.key} />
            ) : (
              // LIST
              <ListKVComponent kvCollection={model.pair.collection} kvKey={model.pair.key} />
            ),
          );
          adminMenu.subMenus.push({
            key: componentName,
            title: model.name,
            linkTo: 'content::blank',
            component: componentName,
          });
        });
      }

      AppContext._context.menu = new MenuAdapter(register.definitions.sideMenus);
    }
  }
}

export { AppContext };
