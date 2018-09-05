import { AnyAction, Dispatch } from 'redux';

import getConfig from 'next/config';
import { Subject } from 'rxjs';

import { RootState, IStoreConnector } from '@asuna-admin/store';
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

type LoginModuleRegister = {
  module: 'login';
  register: ILoginRegister;
};

type IndexModuleRegister = {
  module: 'index';
  register: IIndexRegister;
};

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

const { serverRuntimeConfig = {} } = getConfig() || {};

class AppContext {
  private _context: {
    auth: AuthAdapter;
    response: ResponseAdapter;
    menu: MenuAdapter;
    api: ApiAdapter;
    security: SecurityAdapter;
    models: ModelAdapter;
    ws: WsAdapter;
  };
  private _dispatch: Dispatch;
  private _subject;
  private _storeConnector: IStoreConnector<RootState>;

  constructor() {
    // this._context = { ...this._context, ws: new WsAdapter(this) };
    this._subject = new Subject();
    // this._subject.subscribe({
    //   next: (action) => console.log('observer: ', action)
    // });
    (async () => {
      const { storeConnector } = await import('../store');
      this._storeConnector = storeConnector;
    })();
  }

  regStore(storeConnector: IStoreConnector<RootState>) {
    this._storeConnector = storeConnector;
  }

  regDispatch(dispatch: Dispatch): void {
    this._dispatch = this._dispatch || dispatch;
  }

  dispatch(action: AnyAction) {
    !serverRuntimeConfig.isServer && this._dispatch && this._dispatch(action);
  }

  actionHandler(action: AnyAction) {
    !serverRuntimeConfig.isServer && this._subject && this._subject.next(action);
  }

  /**
   * 提供全局的注册方法
   * @param {ILoginRegister & IIndexRegister} moduleRegister
   */
  setup(moduleRegister: ILoginRegister & IIndexRegister): void;
  /**
   * 提供基于模块的注册方法
   * @param {LoginModuleRegister | IndexModuleRegister} moduleRegister
   */
  setup(moduleRegister: LoginModuleRegister | IndexModuleRegister): void;
  setup(moduleRegister): void {
    if (moduleRegister.module) {
      const register = moduleRegister.register;
      if (moduleRegister.module === 'login') {
        this._context = {
          ...this._context,
          auth: new AuthAdapter(register.createAuthService()),
          ws: new WsAdapter(),
        };
      } else {
        this._context = {
          ...this._context,
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
    } else {
      const register = moduleRegister;
      this._context = {
        ...this._context,
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

  get ctx() {
    return this._context;
  }

  get store() {
    return this._storeConnector;
  }

  get subject() {
    return this._subject;
  }
}

const appContext = new AppContext();

export { AppContext, appContext };
