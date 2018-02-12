export const menuProxy = {
  init               : () => global.context.menu.init(),
  getRegisteredModels: () => global.context.menu.getRegisteredModels(),
};

export class MenuAdapter {
  constructor(service, registeredModels) {
    this.service          = service;
    this.registeredModels = registeredModels;
  }

  getRegisteredModels() {
    return this.registeredModels;
  }

  init() {
    return [...this.getRegisteredModels()];
  }
}
