// @flow
import * as R from 'ramda';

import { createLogger } from '../adapters/logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------


declare type InitParams = {
  authorities: any,
}

declare interface IMenuService {
  init: InitParams => any,
  getRegisteredModels: () => any,
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:menu');

export const menuProxy: IMenuService = {
  init               : args => global.context.menu.init(args),
  getRegisteredModels: () => global.context.menu.getRegisteredModels(),
};

export class MenuAdapter implements IMenuService {
  service: IMenuService;
  registeredModels: any;

  constructor(service: IMenuService, registeredModels: any) {
    this.service          = service;
    this.registeredModels = registeredModels;
  }

  getRegisteredModels = () => this.registeredModels;

  init = (authorities) => {
    logger.log('[MenuAdapter][init]', authorities);

    const includedSubMenus = menu =>
      R.filter(subMenu => R.propOr(false, `${menu.key}::${subMenu.key}`)(authorities))(menu.subMenus);

    const menus = R.compose(
      R.filter(menu => R.not(R.isEmpty(R.prop('subMenus')(menu)))),
      R.map(menu => ({ ...menu, subMenus: includedSubMenus(menu) })),
    )(this.getRegisteredModels());
    logger.log('[MenuAdapter][init]', 'filtered menus is', menus);

    return [...menus];
  };
}
