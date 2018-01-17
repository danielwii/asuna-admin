import * as R from 'ramda';

import { DynamicFormTypes } from '../components/DynamicForm';

export const modelsProxy = {
  modelConfigs: name => global.context.models.modelConfigs(name),
  formFields  : (schema, name) => global.context.models.formSchema(schema, name),

  /**
   * load schema list
   * @param token
   * @param name
   * @returns {*}
   */
  loadModels    : ({ token }, { name }) => global.context.models.loadModels({ token }, { name }),
  /**
   * load definition of schema
   * @param token
   * @param name
   * @returns {*}
   */
  loadSchema    : ({ token }, { name }) => global.context.models.loadSchema({ token }, { name }),
  /**
   * load all schemas
   * @param token
   * @returns {*}
   */
  loadAllSchemas: ({ token }) => global.context.models.loadAllSchemas({ token }),

  /**
   * update model if id exists in body, insert new one or else.
   * @param config - { token }
   * @param model  - model name
   * @param data   - model body
   * @returns {*}
   */
  upsert: (config, model, data) => global.context.models.upsert(config, model, data),
};

export class ModelsAdapter {
  constructor(service, modelsConfigs) {
    this.service       = service;
    this.allModels     = Object.keys(modelsConfigs);
    this.modelsConfigs = modelsConfigs;
  }

  identifyType = (name) => {
    if (/VARCHAR.+/.test(name)) return DynamicFormTypes.Input;
    if (/INTEGER|FLOAT/.test(name)) return DynamicFormTypes.InputNumber;
    if (/TEXT/.test(name)) return DynamicFormTypes.TextArea;
    if (/DATETIME/.test(name)) return DynamicFormTypes.DateTime;
    if (/BOOLEAN/.test(name)) return DynamicFormTypes.Switch;

    console.warn('type', name, 'cannot identified.');
    return name;
  };

  upsert = (config, model, data) => {
    if (R.prop('id')(model)) {
      this.service.update(config, model, data);
    } else {
      this.service.insert(config, model, data);
    }
  };

  modelConfigs = name => this.modelsConfigs[name];
  formSchema   = (schema, name) => {
    console.log('schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map(formatted => ({ [formatted.name]: formatted })),
      R.map(field => ({
        name   : field.name,
        type   : this.identifyType(R.path(['config', 'type'])(field)),
        options: { label: R.path(['config', 'info', 'name'])(field) },
      })),
    )(schema);
  };

  loadModels     = ({ token }, { name }) => this.service.loadModels({ token }, { name });
  loadSchema     = ({ token }, { name }) => this.service.loadSchema({ token }, { name });
  // eslint-disable-next-line function-paren-newline
  loadAllSchemas = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, { name }) })))
}
