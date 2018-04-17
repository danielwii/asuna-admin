import { AuthAdapter, IAuthService }         from '../adapters/auth';
import { ISecurityService, SecurityAdapter } from '../adapters/security';
import { IModelService, ModelAdapter }       from '../adapters/models';
import { IMenuService, MenuAdapter }         from '../adapters/menu';
import { ResponseAdapter }                   from '../adapters/response';
import { ApiAdapter, IApiService }           from '../adapters/api';

// --------------------------------------------------------------
// Setup context
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
    associations: any;
    modelConfigs: any;
    registeredModels: any;

  };
}

type LoginModuleRegister = {
  module: 'login';
  register: ILoginRegister,
}

type IndexModuleRegister = {
  module: 'index';
  register: IIndexRegister,
}

class AppContext {
  private context: {
    auth: AuthAdapter;
    response: ResponseAdapter;
    menu: MenuAdapter;
    api: ApiAdapter;
    security: SecurityAdapter;
    models: ModelAdapter;
  };

  public setup(moduleRegister: LoginModuleRegister | IndexModuleRegister): void {
    // console.log('[AppContext]', { moduleRegister });
    if (moduleRegister.module === 'login') {
      this.context = {
        ...this.context,
        auth: new AuthAdapter(moduleRegister.register.createAuthService()),
      }
    } else {
      this.context = {
        auth    : new AuthAdapter(moduleRegister.register.createAuthService()),
        response: new ResponseAdapter(),
        menu    : new MenuAdapter(
          moduleRegister.register.createMenuService(),
          moduleRegister.register.createDefinitions().registeredModels,
        ),
        api     : new ApiAdapter(moduleRegister.register.createApiService()),
        security: new SecurityAdapter(moduleRegister.register.createSecurityService()),
        models  : new ModelAdapter(
          moduleRegister.register.createModelService(),
          moduleRegister.register.createDefinitions().modelConfigs,
          moduleRegister.register.createDefinitions().associations,
        ),
      }
    }
  }

  get ctx() {
    return this.context;
  }
}

const appContext = new AppContext();

export { appContext };
