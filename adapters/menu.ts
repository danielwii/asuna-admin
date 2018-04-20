import * as R from 'ramda';

import { createLogger, lv } from '../helpers';
import { appContext }       from '../app/context';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IMenuService {
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:menu', lv.warn);

export const menuProxy = {
  init               : (isSysAdmin, authorities) => appContext.ctx.menu.init(isSysAdmin, authorities),
  getRegisteredModels: () => appContext.ctx.menu.getRegisteredModels(),
};

export class MenuAdapter {

  constructor(private service: IMenuService,
              private registeredModels: Asuna.Schema.Menu[]) {
  }

  getRegisteredModels = (): Asuna.Schema.Menu[] => this.registeredModels;

  init = (isSysAdmin, authorities) => {
    logger.log('[MenuAdapter][init]', 'isSysAdmin', isSysAdmin, 'authorities', authorities);

    // 系统管理员默认显示所有菜单项
    if (isSysAdmin) {
      return this.getRegisteredModels();
    }

    const includedSubMenus = (menu: Asuna.Schema.Menu): Asuna.Schema.SubMenu[] =>
      R.filter((subMenu: Asuna.Schema.SubMenu) => R.propOr(false, `${menu.key}::${subMenu.key}`)(authorities))(menu.subMenus);

    const menus = R.compose(
      R.filter(menu => R.not(R.isEmpty(R.prop('subMenus', menu)))),
      R.map(menu => ({ ...menu, subMenus: includedSubMenus(menu) })),
    )(this.getRegisteredModels()) as Asuna.Schema.Menu[];
    logger.log('[MenuAdapter][init]', 'filtered menus is', menus);

    return [...menus];
  };
}
