import {
  AdminAdapter,
  AdminAdapterImpl,
  ApiAdapter,
  AuthAdapter,
  IAdminService,
  IApiService,
  IAuthService,
  IMenuService,
  IModelService,
  ISecurityService,
  MenuAdapter,
  ModelAdapter,
  ResponseAdapter,
  SecurityAdapterImpl,
  WsAdapter,
} from '@asuna-admin/adapters';
import { GraphqlAdapter } from '@asuna-admin/adapters/graphql';
import { Config } from '@asuna-admin/config';
import { AsunaDefinitions } from '@asuna-admin/core/definitions';
import { AuthState, IStoreConnector, RootState } from '@asuna-admin/store';
import * as React from 'react';
import { AnyAction, Dispatch } from 'redux';
import { Subject } from 'rxjs';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IComponentService {
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
    api: ApiAdapter;
    admin: AdminAdapter;
    security: SecurityAdapterImpl;
    models: ModelAdapter;
    ws: WsAdapter;
    components: IComponentService;
    graphql: GraphqlAdapter;
  };

  /**
   * 提供一种脱离 redux-connect 调用 dispatch 的方式
   */
  private static _dispatch: Dispatch;
  private static _subject;
  private static _isServer = typeof window === 'undefined';
  private static _storeConnector: IStoreConnector<RootState>;

  static serverSettings: object;

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
    if (!AppContext._dispatch) {
      AppContext._dispatch = AppContext._dispatch || dispatch;
    }
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
  public static setup(moduleRegister: ILoginRegister & IIndexRegister): void;
  /**
   * 提供基于模块的注册方法
   * @param {LoginModuleRegister | IndexModuleRegister} moduleRegister
   */
  public static setup(moduleRegister: LoginModuleRegister | IndexModuleRegister): void;
  public static setup(moduleRegister): void {
    if (moduleRegister.module) {
      const register = moduleRegister.register;

      if (moduleRegister.module === 'login') {
        AppContext._context = {
          ...AppContext._context,
          auth: new AuthAdapter(register.createAuthService()),
          ws: new WsAdapter(),
        };
      } else {
        this.registerIndex(register);
      }
    } else {
      this.registerIndex(moduleRegister);
    }
  }

  public static set isServer(isServer: boolean | undefined) {
    AppContext._isServer = !!isServer;
  }

  public static get isServer() {
    return AppContext._isServer;
  }

  public static get isDevMode() {
    return this.isDebugMode || AppContext.nextConfig.publicRuntimeConfig?.env !== 'production';
  }

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

  public static syncServerSettings() {
    AppContext.ctx.graphql
      .loadSystemSettings()
      .then(
        settings => (this.serverSettings = Object.assign({}, ...settings.map(setting => ({ [setting.key]: setting })))),
      );
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

  private static registerIndex(register: IIndexRegister) {
    AppContext._context = {
      ...AppContext._context,
      auth: new AuthAdapter(register.createAuthService()),
      response: new ResponseAdapter(),
      menu: new MenuAdapter(register.definitions.sideMenus),
      api: new ApiAdapter(register.createApiService()),
      admin: new AdminAdapterImpl(register.createAdminService()),
      security: new SecurityAdapterImpl(register.createSecurityService()),
      models: new ModelAdapter(register.modelService, register.definitions),
      ws: new WsAdapter(),
      components: register.componentService,
      graphql: new GraphqlAdapter(Config.get('GRAPHQL_HOST')),
    };

    this.syncServerSettings();
  }
}

export { AppContext };
