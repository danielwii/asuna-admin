import * as R from 'ramda';

import { createLogger } from '../logger';

import type { Asuna } from '../types';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IMenuService {}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:menu');

export class MenuAdapter {
  // private readonly service: IMenuService;
  private readonly sideMenus: Asuna.Schema.Menu[];

  constructor(/*service: IMenuService, */ sideMenus: Asuna.Schema.Menu[]) {
    // this.service = service;
    this.sideMenus = sideMenus;
  }

  getSideMenus = (): Asuna.Schema.Menu[] => this.sideMenus;

  init = (isSysAdmin, authorities: { [authority: string]: boolean }) => {
    logger.log('[MenuAdapter][init]', { isSysAdmin, authorities });

    // 系统管理员默认显示所有菜单项
    if (isSysAdmin) return this.getSideMenus();

    const includedSubMenus = (menu: Asuna.Schema.Menu): Asuna.Schema.SubMenu[] =>
      R.filter((subMenu: Asuna.Schema.SubMenu) => R.propOr(false, `${menu.key}::${subMenu.key}`)(authorities))(
        menu.subMenus,
      );

    const menus = R.compose(
      R.filter<Asuna.Schema.Menu>((menu) => R.not(R.isEmpty(R.prop('subMenus', menu)))),
      R.map<Asuna.Schema.Menu, Asuna.Schema.Menu>((menu) => ({ ...menu, subMenus: includedSubMenus(menu) })),
    )(this.getSideMenus());
    logger.log('[MenuAdapter][init]', 'filtered menus is', menus);

    return [...menus];
  };
}
