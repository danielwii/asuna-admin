import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import getConfig from 'next/config';
import * as React from 'react';
import { Subject } from 'rxjs';

import { AdminAdapter, AdminAdapterImpl, IAdminService } from '../adapters/admin';
import { ApiAdapterImpl, IApiService } from '../adapters/api';
import { AuthAdapter, IAuthService } from '../adapters/auth';
import { GraphqlAdapterImpl, KeyValueModelVo } from '../adapters/graphql';
import { MenuAdapter } from '../adapters/menu';
import { ResponseAdapter } from '../adapters/response';
import { ISecurityService, SecurityAdapterImpl } from '../adapters/security';
import { WsAdapter } from '../adapters/ws';
import { createLogger } from '../logger';
import { Asuna } from '../types';
import { Constants } from './constants';

import type { Func } from '../adapters/func';
import type { ModelAdapterImpl } from '../adapters/model';
import type { SharedPanesFunc } from '../store/panes.global';
import type { AsunaDefinitions } from './definitions';

const logger = createLogger('core:context');

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IComponentService {
  regGraphql: (componentName: string, model?: KeyValueModelVo, render?: React.FC) => void;
  load: (componentName: string) => React.FC;
}

export interface ILoginRegister {
  createAuthService: () => IAuthService;
}

export interface IIndexRegister extends ILoginRegister {
  createAuthService: () => IAuthService;
  // createMenuService(): IMenuService;
  createApiService: () => IApiService;
  createAdminService: () => IAdminService;
  createSecurityService: () => ISecurityService;
  createModelAdapter: (graphql: GraphqlAdapterImpl) => ModelAdapterImpl;
  definitions: AsunaDefinitions;
  componentService: IComponentService;
}

export interface LoginModuleRegister {
  module: 'login';
  register: ILoginRegister;
}

export interface IndexModuleRegister {
  module: 'index';
  register: IIndexRegister;
}

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

  private static _subject;
  // private static _stateMachines;

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

    if (!this.INSTANCE) {
      this.INSTANCE = new AppContext();
    }
  }

  // constructor() {}

  static get instance() {
    return AppContext.INSTANCE;
  }

  public static globalFunc: Partial<{ panes: SharedPanesFunc }> = {};

  /*
  public static actionHandler(action: AnyAction) {
    !(typeof window === 'undefined') && AppContext._subject && AppContext._subject.next(action);
  }
*/

  /**
   * 提供全局的注册方法
   * @param {ILoginRegister & IIndexRegister} moduleRegister
   * @param func
   */
  public static async setup(moduleRegister: ILoginRegister & IIndexRegister, func: typeof Func): Promise<void>;
  /**
   * 提供基于模块的注册方法
   * @param {LoginModuleRegister | IndexModuleRegister} moduleRegister
   * @param func
   */
  public static async setup(
    moduleRegister: LoginModuleRegister | IndexModuleRegister,
    func: typeof Func,
  ): Promise<void>;
  public static async setup(moduleRegister, func: typeof Func): Promise<void> {
    logger.info('setup moduleRegister: ', moduleRegister);
    if (moduleRegister.module) {
      const register = moduleRegister.register;

      if (moduleRegister.module === 'login') {
        AppContext._context = {
          ...AppContext._context,
          auth: new AuthAdapter(register.createAuthService()),
          // ws: new WsAdapter(),
        };
      } else {
        await this.registerIndex(register, 'index');
      }
    } else {
      await this.registerIndex(moduleRegister);
    }

    const schemas = await func.loadAllSchemas();
    localStorage.setItem('schemas', JSON.stringify(schemas));
  }

  // public static set stateMachines(stateMachines: any) {
  //   this._stateMachines = stateMachines;
  // }

  public static get ctx() {
    return AppContext._context;
  }

  public static get subject() {
    return AppContext._subject;
  }

  public static get adapters() {
    return AppContext._context;
  }

  // public static get stateMachines() {
  //   return AppContext._stateMachines;
  // }

  public static async syncSettings() {
    logger.info('load system settings...');
    const settings = await AppContext.ctx.graphql.loadSystemSettings();
    logger.success('loaded system settings...', settings);
    if (settings) {
      this.serverSettings = Object.assign({}, ...settings.map((setting) => ({ [setting.key]: setting })));
    }

    logger.info('load constants...');
    const constants = await AppContext.ctx.graphql.loadKv('app.settings', 'constants');
    logger.success('loaded constants...', constants);
    if (constants) Constants.constants = constants.value;

    // const stateMachines = await AppContext.ctx.admin.stateMachines();
    // if (stateMachines) this.stateMachines = stateMachines;

    const kvModels = await AppContext.ctx.graphql.loadKvModels();
    if (kvModels) this.kvModels = kvModels;
  }

  static async getFormSchema(modelName: string): Promise<Asuna.Schema.FormSchemas | undefined> {
    return modelName ? AppContext.adapters.models.getFormSchema(modelName) : undefined;
  }

  static async getSchema(modelName: string): Promise<Asuna.Schema.OriginSchema | undefined> {
    return modelName ? AppContext.adapters.models.loadOriginSchema(modelName) : undefined;
  }

  static async getColumnInfo(modelName: string, columnName: string): Promise<Asuna.Schema.ModelSchema | undefined> {
    const schema = await this.getSchema(modelName);
    return _.find(schema?.columns, (column) => column.name === columnName);
  }

  private static async registerIndex(register: IIndexRegister, module?: 'index'): Promise<void> {
    logger.info('register index module:', module);
    const uri = getConfig().publicRuntimeConfig.GRAPHQL_ENDPOINT ?? 'proxy/graphql';
    const graphql = new GraphqlAdapterImpl(uri);
    AppContext._context = {
      ...AppContext._context,
      auth: new AuthAdapter(register.createAuthService()),
      response: new ResponseAdapter(),
      api: new ApiAdapterImpl(register.createApiService()),
      security: new SecurityAdapterImpl(register.createSecurityService()),
      models: register.createModelAdapter(graphql),
      // ws: new WsAdapter(),
      components: register.componentService,
      admin: new AdminAdapterImpl(register.createAdminService()),
      graphql: graphql,
    };

    // only setup menu in index page
    if (module === 'index') {
      logger.info('sync settings...');
      await this.syncSettings();

      // --------------------------------------------------------------
      // 将 kv 压入 admin menus
      // --------------------------------------------------------------

      const adminMenu = register.definitions.sideMenus.find(_.matches({ key: 'admin' }));
      logger.debug('adminMenu', { adminMenu, sideMenus: register.definitions.sideMenus });
      if (adminMenu) {
        const adminKvModels = AppContext.kvModels.filter(fp.get('formatType'));
        adminKvModels.forEach((model) => {
          const component = `${model.pair.collection}#${model.pair.key}`;
          logger.log('regGraphql', { model, component });
          register.componentService.regGraphql(component, model);
          adminMenu.subMenus.push({ key: component, title: model.name, linkTo: 'content::blank', component });
        });
      }

      AppContext._context.menu = new MenuAdapter(register.definitions.sideMenus);
    }
  }
}

export { AppContext };
