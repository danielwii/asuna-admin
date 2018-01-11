export const modelsProxy = {
  modelConfig   : name => global.context.models.modelConfig(name),
  loadModels    : ({ token }, { name }) => global.context.models.loadModels({ token }, { name }),
  loadOptions   : ({ token }, { name }) => global.context.models.loadOptions({ token }, { name }),
  loadAllOptions: ({ token }) => global.context.models.loadAllOptions({ token }),
};

export class ModelsAdapter {
  constructor(service, modelsConfig) {
    this.service      = service;
    this.allModels    = Object.keys(modelsConfig);
    this.modelsConfig = modelsConfig;
  }

  modelConfig    = name => this.modelsConfig[name];
  loadModels     = ({ token }, { name }) => this.service.loadModels({ token }, { name });
  loadOptions    = ({ token }, { name }) => this.service.loadOptions({ token }, { name });
  // eslint-disable-next-line function-paren-newline
  loadAllOptions = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadOptions({ token }, { name }) })))
}
