export const modelsProxy = {
  loadOptions   : ({ token }, { name }) => global.context.models.loadOptions({ token }, { name }),
  loadAllOptions: ({ token }) => global.context.models.loadAllOptions({ token }),
};

export class ModelsAdapter {
  constructor(service, allModels) {
    this.service   = service;
    this.allModels = allModels;
  }

  loadOptions    = ({ token }, { name }) => this.service.loadOptions({ token }, { name });
  loadAllOptions = ({ token }) => Object.assign(...this.allModels.map(name => ({ [name]: this.loadOptions({ token }, { name }) })));
}
