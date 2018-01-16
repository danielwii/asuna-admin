export const modelsProxy = {
  modelConfigs: name => global.context.models.modelConfigs(name),

  loadModels    : ({ token }, { name }) => global.context.models.loadModels({ token }, { name }),
  loadSchema    : ({ token }, { name }) => global.context.models.loadSchema({ token }, { name }),
  loadAllSchemas: ({ token }) => global.context.models.loadAllSchemas({ token }),
};

export class ModelsAdapter {
  constructor(service, modelsConfigs) {
    this.service       = service;
    this.allModels     = Object.keys(modelsConfigs);
    this.modelsConfigs = modelsConfigs;
  }

  modelConfigs = name => this.modelsConfigs[name];

  loadModels     = ({ token }, { name }) => this.service.loadModels({ token }, { name });
  loadSchema     = ({ token }, { name }) => this.service.loadSchema({ token }, { name });
  // eslint-disable-next-line function-paren-newline
  loadAllSchemas = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, { name }) })))
}
