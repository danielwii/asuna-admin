import { AuthAdapter }     from 'adapters/auth';
import { SecurityAdapter } from 'adapters/security';
import { ModelsAdapter }   from 'adapters/models';
import { MenuAdapter }     from 'adapters/menu';
import { ResponseAdapter } from 'adapters/response';
import { ApiAdapter }      from 'adapters/api';

// --------------------------------------------------------------
// Setup context
// --------------------------------------------------------------

export interface AppContext {
  config: any,
  context?: {
    auth: any,
    response: any,
    menu: any,
    api: any,
    security: any,
    models: any,
  },
  init: any,
}

export const AppContext: AppContext = {
  set config(config) {
    AppContext.config = config;
  },
  init(Register) {
    console.log('[AppContext] init ...', Register);

    AppContext.config  = Register.config;
    AppContext.context = {
      auth    : new AuthAdapter(Register.authService),
      response: new ResponseAdapter(),
      menu    : new MenuAdapter(Register.menuService, Register.definitions.registeredModels),
      api     : new ApiAdapter(Register.apiService),
      security: new SecurityAdapter(Register.securityService),
      models  : new ModelsAdapter(
        Register.modelsService,
        Register.definitions.modelConfigs,
        Register.definitions.associations,
      ),
    };
    console.log('[AppContext] AppContext is', AppContext);
  },
};

export default AppContext;
