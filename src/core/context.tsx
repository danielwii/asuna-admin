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
import { IModelService, ModelAdapterImpl } from '../adapters/model';
import { ResponseAdapter } from '../adapters/response';
import { ISecurityService, SecurityAdapterImpl } from '../adapters/security';
import { WsAdapter } from '../adapters/ws';
import { GroupFormKVComponent } from '../components/KV/group';
import { ListKVComponent } from '../components/KV/list';
import { storeConnector } from '../store/middlewares/store-connector';
import { Constants } from './constants';
import { Store } from './store';

import type { AnyAction } from 'redux';
import type { SharedPanesFunc } from '../store/panes.global';
import type { AsunaDefinitions } from './definitions';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IComponentService {
  regGraphql: (componentName: string, renderComponent: React.FC) => void;
  load: (componentName: string) => React.FC;
}

export interface ILoginRegister {
  createAuthService: () => IAuthService;
}

export interface IIndexRegister extends ILoginRegister {
  createAuthService: () => IAuthService;

  modelService: IModelService;

  // createMenuService(): IMenuService;

  createApiService: () => IApiService;

  createAdminService: () => IAdminService;

  createSecurityService: () => ISecurityService;

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
  private static _stateMachines;

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
    if (!Store.storeConnector) {
      Store.storeConnector = storeConnector;
    }

    if (!this.INSTANCE) {
      this.INSTANCE = new AppContext();
    }
  }

  // constructor() {}

  static get instance() {
    return AppContext.INSTANCE;
  }

  public static globalFunc: Partial<{ panes: SharedPanesFunc }> = {};

  public static actionHandler(action: AnyAction) {
    !(typeof window === 'undefined') && AppContext._subject && AppContext._subject.next(action);
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

  public static set stateMachines(stateMachines: any) {
    this._stateMachines = stateMachines;
  }

  public static get publicConfig() {
    return AppContext.nextConfig.publicRuntimeConfig || {};
  }

  public static get ctx() {
    return AppContext._context;
  }

  public static get subject() {
    return AppContext._subject;
  }

  public static get adapters() {
    return AppContext._context;
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
    if (constants) Constants.constants = constants.value;

    const stateMachines = await AppContext.ctx.admin.stateMachines();
    if (stateMachines) this.stateMachines = stateMachines;

    const kvModels = await AppContext.ctx.graphql.loadKvModels();
    if (kvModels) this.kvModels = kvModels;
  }

  private static async registerIndex(register: IIndexRegister, module?: 'index'): Promise<void> {
    const graphql = new GraphqlAdapterImpl(getConfig().publicRuntimeConfig.GRAPHQL_ENDPOINT ?? 'proxy');
    AppContext._context = {
      ...AppContext._context,
      auth: new AuthAdapter(register.createAuthService()),
      response: new ResponseAdapter(),
      api: new ApiAdapterImpl(register.createApiService()),
      security: new SecurityAdapterImpl(register.createSecurityService()),
      models: new ModelAdapterImpl(register.modelService, register.definitions, graphql),
      ws: new WsAdapter(),
      components: register.componentService,
      admin: new AdminAdapterImpl(register.createAdminService()),
      graphql: graphql,
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
