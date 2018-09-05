import { AnyAction, Dispatch } from 'redux';

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

class AppContext {
  static serverRuntimeConfig;

  private static _context: {
    auth: AuthAdapter;
    response: ResponseAdapter;
    menu: MenuAdapter;
    api: ApiAdapter;
    security: SecurityAdapter;
    models: ModelAdapter;
    ws: WsAdapter;
  };
  private static _dispatch: Dispatch;
  private static _subject;
  private static _storeConnector: IStoreConnector<RootState>;

  constructor(nextGetConfig?) {
    if (!AppContext.serverRuntimeConfig) {
      const { serverRuntimeConfig: serverConfig = {} } = nextGetConfig ? nextGetConfig() : {};
      AppContext.serverRuntimeConfig = serverConfig;
    }
    // this._context = { ...this._context, ws: new WsAdapter(this) };
    if (!AppContext._subject) {
      AppContext._subject = new Subject();
    }
    // this._subject.subscribe({
    //   next: (action) => console.log('observer: ', action)
    // });
    if (!AppContext._storeConnector) {
      (async () => {
        const { storeConnector } = await import('../store');
        AppContext._storeConnector = storeConnector;
      })();
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
    !AppContext.serverRuntimeConfig.isServer &&
      AppContext._dispatch &&
      AppContext._dispatch(action);
  }

  public static actionHandler(action: AnyAction) {
    !AppContext.serverRuntimeConfig.isServer &&
      AppContext._subject &&
      AppContext._subject.next(action);
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
        AppContext._context = {
          ...AppContext._context,
          auth: new AuthAdapter(register.createAuthService()),
          ws: new WsAdapter(),
        };
      } else {
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
    } else {
      const register = moduleRegister;
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

  public static get ctx() {
    return AppContext._context;
  }

  public static get store() {
    return AppContext._storeConnector;
  }

  public static get subject() {
    return AppContext._subject;
  }
}

export { AppContext };
