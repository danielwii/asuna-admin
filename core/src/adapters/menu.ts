import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import * as R from 'ramda';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IMenuService {}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:menu');

export const menuProxy = {
  init: (isSysAdmin, authorities) => AppContext.ctx.menu.init(isSysAdmin, authorities),
  getSideMenus: () => AppContext.ctx.menu.getSideMenus(),
};

export class MenuAdapter {
  private service: IMenuService;
  private sideMenus: Asuna.Schema.Menu[];

  constructor(service: IMenuService, sideMenus: Asuna.Schema.Menu[]) {
    this.service = service;
    this.sideMenus = sideMenus;
  }

  getSideMenus = (): Asuna.Schema.Menu[] => this.sideMenus;

  init = (isSysAdmin, authorities) => {
    logger.log('[MenuAdapter][init]', 'isSysAdmin', isSysAdmin, 'authorities', authorities);

    // 系统管理员默认显示所有菜单项
    if (isSysAdmin) return this.getSideMenus();

    const includedSubMenus = (menu: Asuna.Schema.Menu): Asuna.Schema.SubMenu[] =>
      R.filter((subMenu: Asuna.Schema.SubMenu) =>
        R.propOr(false, `${menu.key}::${subMenu.key}`)(authorities),
      )(menu.subMenus);

    const menus = R.compose(
      R.filter(menu => R.not(R.isEmpty(R.prop('subMenus', menu)))),
      R.map(menu => ({ ...menu, subMenus: includedSubMenus(menu) })),
    )(this.getSideMenus()) as Asuna.Schema.Menu[];
    logger.log('[MenuAdapter][init]', 'filtered menus is', menus);

    return [...menus];
  };
}
