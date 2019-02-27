import { AnyAction, Dispatch } from 'redux';
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
import { AsunaDefinitions } from '@asuna-admin/core/definitions';
import idx from 'idx';
import * as React from 'react';

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

  createMenuService(): IMenuService;

  createApiService(): IApiService;

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
  private static nextConfig: INextConfig = {
    serverRuntimeConfig: {},
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
    components: IComponentService;
  };

  /**
   * 提供一种脱离 redux-connect 调用 dispatch 的方式
   */
  private static _dispatch: Dispatch;
  private static _subject;
  private static _isServer: boolean;
  private static _storeConnector: IStoreConnector<RootState>;

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
  }

  public static regStore(
    storeConnector: IStoreConnector<RootState>,
    initialState?: object,
    force?: boolean,
  ) {
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
    return idx(AppContext.nextConfig.publicRuntimeConfig, _ => _.env) === 'dev';
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
      menu: new MenuAdapter(register.createMenuService(), register.definitions.sideMenus),
      api: new ApiAdapter(register.createApiService()),
      security: new SecurityAdapter(register.createSecurityService()),
      models: new ModelAdapter(register.modelService, register.definitions),
      ws: new WsAdapter(),
      components: register.componentService,
    };
  }
}

export { AppContext };
