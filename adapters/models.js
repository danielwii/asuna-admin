import * as R from 'ramda';
import _      from 'lodash';

import { DynamicFormTypes } from '../components/DynamicForm';
import { createLogger }     from '../adapters/logger';

const logger = createLogger('adapters:models', 1);

export const modelsProxy = {
  getModelConfigs: name => global.context.models.getModelConfig(name),
  // eslint-disable-next-line function-paren-newline
  getFormFields  : (schemas, name, values) =>
    global.context.models.getFormSchema(schemas, name, values),

  getFieldsOfAssociations: () => global.context.models.getFieldsOfAssociations(),

  /**
   * load schema list
   * @param token
   * @param name
   * @param data - { pagination, filters, sorter }
   * @returns {*}
   */
  // eslint-disable-next-line function-paren-newline
  loadModels: ({ token }, name, data = {}) =>
    global.context.models.loadModels({ token }, name, data),

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
  listSchemasCallable: ({ token }) => global.context.models.listSchemasCallable({ token }),

  listAssociationsCallable: ({ token }, associationNames) =>
    global.context.models.listAssociationsCallable({ token }, associationNames),

  fetch: ({ token }, modelName, data) => global.context.models.fetch({ token }, modelName, data),

  /**
   * update model if id exists in body, insert new one or else.
   * @param {token}    - { token }
   * @param modelName  - model name
   * @param data       - model body
   * @returns {*}
   */
  upsert: ({ token, schemas }, modelName, data) =>
    global.context.models.upsert({ token, schemas }, modelName, data),
};

export class ModelsAdapter {
  constructor(service, modelConfigs) {
    this.service      = service;
    this.allModels    = Object.keys(modelConfigs);
    this.modelConfigs = modelConfigs;
  }

  identifyType = (field) => {
    if (['id', 'created_at', 'updated_at'].indexOf(field.name) > -1) {
      return DynamicFormTypes.Plain;
    }

    if (R.endsWith('_id')(field.name)) {
      return DynamicFormTypes.Association;
    }

    if (R.path(['config', 'info', 'type'])(field) === 'RICHTEXT') {
      return DynamicFormTypes.RichText;
    }

    const type = R.path(['config', 'type'])(field);

    if (/VARCHAR.+/.test(type)) return DynamicFormTypes.Input;
    if (/INTEGER|FLOAT/.test(type)) return DynamicFormTypes.InputNumber;
    if (/TEXT/.test(type)) return DynamicFormTypes.TextArea;
    if (/DATETIME/.test(type)) return DynamicFormTypes.DateTime;
    if (/BOOLEAN/.test(type)) return DynamicFormTypes.Switch;

    logger.warn('[identifyType] type', type, 'cannot identified.');
    return type;
  };

  fetch = (config, modelName, data) => this.service.fetch(config, modelName, data);

  upsert = ({ token, schemas }, modelName, data: { body: any }) => {
    logger.info('[upsert] upsert', modelName, data);

    const fields = this.getFormSchema(schemas, modelName);

    logger.info('[upsert] fields is', fields);

    const transformed = _.mapKeys(data.body, (value, key) => _.get(fields, `${key}.ref`, key));
    logger.info('[upsert] transformed is', transformed);

    const id = R.path(['body', 'id'])(data);
    if (id) {
      return this.service.update({ token }, modelName, { ...data, body: transformed, id });
    }
    return this.service.insert({ token }, modelName, { ...data, body: transformed });
  };

  getModelConfig = (name) => {
    if (this.modelConfigs && this.modelConfigs[name]) {
      return this.modelConfigs[name];
    }
    logger.error(`'${name}' not found in`, this.modelConfigs);
    return {};
  };

  getFormSchema = (schemas, name, values) => {
    if (!schemas || !name) {
      logger.error('[getFormSchema] schemas or name is required. schemas is', schemas, 'name is', name);
      return {};
    }
    const schema = R.prop(name)(schemas);

    if (!schema) {
      logger.error('[getFormSchema ]schema is required.');
      return {};
    }

    logger.log('[getFormSchema] schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map(formatted => ({ [formatted.name]: formatted })),
      R.map(field => ({
        name   : field.name,
        ref    : R.pathOr(field.name, ['config', 'info', 'ref'])(field),
        type   : this.identifyType(field),
        options: {
          label      : R.path(['config', 'info', 'name'])(field),
          foreignKeys: R.path(['config', 'foreign_keys'])(field),
        },
        value  : R.prop(field.name)(values),
      })),
    )(schema);
  };

  getFieldsOfAssociations = R.memoize(() => {
    logger.info('[getFieldsOfAssociations] modelConfigs is', this.modelConfigs);
    const concatValues       = (l, r) => (R.is(String, l) ? l : R.uniq(R.concat(l, r)));
    const isNotEmpty         = R.compose(R.not, R.anyPass([R.isEmpty, R.isNil]));
    const associationsFields = R.compose(
      R.reduce(R.mergeDeepWith(concatValues), {}),
      R.filter(isNotEmpty),
      R.values,
      R.map(R.path(['model', 'associations'])),
    )(this.modelConfigs);
    logger.log('[getFieldsOfAssociations] associationsFields is', associationsFields);
    return associationsFields;
  });

  loadModels = ({ token }, name, { pagination = {}, filters, sorter }) => {
    const { current: page, pageSize: size } = pagination;
    return this.service.loadModels({ token }, name, { pagination: { page, size } });
  };

  loadAssociation = ({ token }, associationName) => {
    if (!associationName) {
      logger.warn('[loadAssociation] associationName is required.');
      return null;
    }

    const fields = R.pathOr([], [associationName, 'fields'])(this.getFieldsOfAssociations());
    return this.service.loadAssociation({ token }, associationName, { fields });
  };

  // eslint-disable-next-line function-paren-newline
  listAssociationsCallable = ({ token }, associationNames) => Object.assign(
    ...associationNames.map(name => ({ [name]: this.loadAssociation({ token }, name) })));

  loadSchema = ({ token }, name) => this.service.loadSchema({ token }, name);

  // eslint-disable-next-line function-paren-newline
  listSchemasCallable = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, name) })))
}
