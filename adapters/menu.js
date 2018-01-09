import _ from 'lodash';

export const menuProxy = {
  init: () => global.context.menu.init(),
};

export class MenuAdapter {
  constructor(service, registeredModels) {
    this.service          = service;
    this.registeredModels = registeredModels;
  }

  generateRegisteredMenu() {
    return this.registeredModels;
  }

  init() {
    return [...this.generateRegisteredMenu()];
  }
}
