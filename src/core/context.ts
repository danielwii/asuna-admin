import { AnyAction, DeepPartial, Dispatch } from 'redux';

import { Subject } from 'rxjs';

import { IStoreConnector, RootState } from '@asuna-admin/store';
import {
  ApiAdapter,
  AuthAdapter,
  IApiService,
  IAuthService,
  IMenuService,
  IModelService,
  ISecurityService,
  MenuAdapter,
  ModelAdapter,
  ResponseAdapter,
  SecurityAdapter,
  WsAdapter,
} from '@asuna-admin/adapters';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface ILoginRegister {
  createAuthService(): IAuthService;
}

export interface IIndexRegister extends ILoginRegister {
  createAuthService(): IAuthService;

  createModelService(): IModelService;

  createMenuService(): IMenuService;

  createApiService(): IApiService;

  createSecurityService(): ISecurityService;

  createDefinitions(): {
    associations: Asuna.Schema.Associations;
    modelConfigs: Asuna.Schema.ModelOpts;
    registeredModels: Asuna.Schema.Menus;
  };
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
  serverRuntimeConfig: { isServer?: boolean };
  publicRuntimeConfig: { env?: string };
}

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

class AppContext {
  static nextConfig: INextConfig = {
    serverRuntimeConfig: { isServer: false },
    publicRuntimeConfig: { env: 'canary' },
  };

  private static _context: {
    auth: AuthAdapter;
    response: ResponseAdapter;
    menu: MenuAdapter;
    api: ApiAdapter;
    security: SecurityAdapter;
    models: ModelAdapter;
    ws: WsAdapter;
  };

  /**
   * 提供一种脱离 redux-connect 调用 dispatch 的方式
   */
  private static _dispatch: Dispatch;
  private static _subject;
  private static _storeConnector: IStoreConnector<RootState>;

  public static init(nextConfig?: INextConfig) {
    if (AppContext.nextConfig == null && nextConfig) {
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
  }

  public static regStore(storeConnector: IStoreConnector<RootState>) {
    if (!AppContext._storeConnector) {
      AppContext._storeConnector = storeConnector;
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

  public static get isServer() {
    return AppContext.nextConfig.serverRuntimeConfig.isServer;
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

  /**
   * 提供了直接通过 redux-store 获取数据的 api
   * @param state
   */
  public static fromStore<K extends keyof RootState>(state: K): RootState[K] {
    return this.store.getState(state);
  }

  private static registerIndex(register: IIndexRegister) {
    AppContext._context = {
      ...AppContext._context,
      auth: new AuthAdapter(register.createAuthService()),
      response: new ResponseAdapter(),
      menu: new MenuAdapter(
        register.createMenuService(),
        register.createDefinitions().registeredModels,
      ),
      api: new ApiAdapter(register.createApiService()),
      security: new SecurityAdapter(register.createSecurityService()),
      models: new ModelAdapter(
        register.createModelService(),
        register.createDefinitions().modelConfigs,
        register.createDefinitions().associations,
      ),
      ws: new WsAdapter(),
    };
  }
}

export { AppContext };
