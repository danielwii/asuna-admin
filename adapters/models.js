import * as R from 'ramda';
import moment from 'moment';

import { DynamicFormTypes } from '../components/DynamicForm';
import { createLogger }     from '../adapters/logger';

const logger = createLogger('adapters:models');

export const modelsProxy = {
  modelConfigs: name => global.context.models.modelConfigs(name),
  formFields  : (schema, name, values) => global.context.models.formSchema(schema, name, values),

  /**
   * load schema list
   * @param token
   * @param name
   * @param data - { pagination, filters, sorter }
   * @returns {*}
   */
  loadModels: ({ token }, { name }, data = {}) => global.context.models.loadModels({ token }, { name }, data),

  /**
   * load definition of schema
   * @param token
   * @param name
   * @returns {*}
   */
  loadSchema: ({ token }, { name }) => global.context.models.loadSchema({ token }, { name }),

  /**
   * load all schemas
   * @param token
   * @returns {*}
   */
  loadAllSchemas: ({ token }) => global.context.models.loadAllSchemas({ token }),

  fetch: (config, modelName, data) => global.context.models.fetch(config, modelName, data),

  /**
   * update model if id exists in body, insert new one or else.
   * @param config     - { token }
   * @param modelName  - model name
   * @param data       - model body
   * @returns {*}
   */
  upsert: (config, modelName, data) => global.context.models.upsert(config, modelName, data),
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

    logger.warn('type', name, 'cannot identified.');
    return name;
  };

  fetch = (config, modelName, data) => this.service.fetch(config, modelName, data);

  upsert = (config, modelName, data) => {
    logger.info('--> upsert', config, modelName, data);
    const id = R.path(['body', 'id'])(data);
    if (id) {
      return this.service.update(config, modelName, { ...data, id });
    }
    return this.service.insert(config, modelName, data);
  };

  modelConfigs = name => this.modelsConfigs[name];
  formSchema   = (schema, name, values) => {
    logger.log('schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map(formatted => ({ [formatted.name]: formatted })),
      R.map(field => ({
        name   : field.name,
        type   : this.identifyType(R.path(['config', 'type'])(field)),
        options: { label: R.path(['config', 'info', 'name'])(field) },
        value  : R.prop(field.name)(values),
      })),
    )(schema);
  };

  loadModels = ({ token }, { name }, { pagination = {}, filters, sorter }) => {
    const { current: page, pageSize: size } = pagination;
    return this.service.loadModels({ token }, { name }, { pagination: { page, size } });
  };

  loadSchema = ({ token }, { name }) => this.service.loadSchema({ token }, { name });

  // eslint-disable-next-line function-paren-newline
  loadAllSchemas = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, { name }) })))
}
