import * as R from 'ramda';

import { createLogger, lv } from 'helpers';
import { appContext }       from 'app/context';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

interface SubMenu {
  key: string;
  title: string;
  linkTo: string;
}

interface Menu {
  key: string;
  title: string;
  subMenus: SubMenu[];
}

export interface IMenuService {
  init(isSysAdmin: boolean, authorities: string): Menu[];

  getRegisteredModels(): Menu[];
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:menu', lv.warn);

export const menuProxy = {
  init               : (...args) => appContext.ctx.menu.init(...args),
  getRegisteredModels: () => appContext.ctx.menu.getRegisteredModels(),
};

export class MenuAdapter {

  constructor(private service: IMenuService,
              private registeredModels: Menu[]) {
  }

  getRegisteredModels = (): Menu[] => this.registeredModels;

  init = (isSysAdmin, authorities) => {
    logger.log('[MenuAdapter][init]', 'isSysAdmin', isSysAdmin, 'authorities', authorities);

    // 系统管理员默认显示所有菜单项
    if (isSysAdmin) {
      return this.getRegisteredModels();
    }

    const includedSubMenus = (menu: Menu): SubMenu[] =>
      R.filter((subMenu: SubMenu) => R.propOr(false, `${menu.key}::${subMenu.key}`)(authorities))(menu.subMenus);

    const menus = R.compose(
      R.filter<Menu>(menu => R.not(R.isEmpty(R.prop('subMenus', menu)))),
      R.map<Menu, Menu>(menu => ({ ...menu, subMenus: includedSubMenus(menu) })) as any,
    )(this.getRegisteredModels()) as any as Menu[];
    logger.log('[MenuAdapter][init]', 'filtered menus is', menus);

    return [...menus];
  };
}
