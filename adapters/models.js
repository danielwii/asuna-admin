import * as R from 'ramda';
import _      from 'lodash';

import { DynamicFormTypes } from '../components/DynamicForm';
import { createLogger }     from '../adapters/logger';

const logger = createLogger('adapters:models');

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

  fetch: ({ token }, name, data) => global.context.models.fetch({ token }, name, data),

  remove: ({ token }, name, data) => global.context.models.remove({ token }, name, data),

  /**
   * update model if id exists in body, insert new one or else.
   * @param {token}    - { token }
   * @param name       - model name
   * @param data       - model body
   * @returns {*}
   */
  upsert: ({ token, schemas }, name, data) =>
    global.context.models.upsert({ token, schemas }, name, data),
};

export class ModelsAdapter {
  constructor(service, modelConfigs) {
    this.service      = service;
    this.allModels    = Object.keys(modelConfigs);
    this.modelConfigs = modelConfigs;

    logger.info('[ModelsAdapter][constructor]', 'init', modelConfigs);
    R.forEachObjIndexed((config, name) => {
      logger.info('[ModelsAdapter][constructor]', 'check', name, config);
      if (!config.table) logger.warn('[ModelsAdapter][constructor]', name, 'should set table');
      if (!config.model) logger.warn('[ModelsAdapter][constructor]', name, 'should set model');
    })(modelConfigs);
  }

  identifyType = (field) => {
    if (['id', 'created_at', 'updated_at'].indexOf(field.name) > -1) {
      return DynamicFormTypes.Plain;
    }

    if (R.endsWith('_id')(field.name) || R.path(['config', 'info'])(field.name)) {
      return DynamicFormTypes.Association;
    }

    const advancedType = R.path(['config', 'info', 'type'])(field);

    if (/^RichText$/i.test(advancedType)) return DynamicFormTypes.RichText;
    if (/^Image$/i.test(advancedType)) return DynamicFormTypes.Image;
    if (/^Images$/i.test(advancedType)) return DynamicFormTypes.Images;
    if (/^Video$/i.test(advancedType)) return DynamicFormTypes.Video;
    if (/^Authorities$/i.test(advancedType)) return DynamicFormTypes.Authorities;

    if (R.path(['config', 'many'])(field) === true) {
      return DynamicFormTypes.ManyToMany;
    }

    const type = R.path(['config', 'type'])(field);

    if (/^VARCHAR.+$/.test(type)) return DynamicFormTypes.Input;
    if (/^INTEGER|FLOAT$/.test(type)) return DynamicFormTypes.InputNumber;
    if (/^TEXT$/.test(type)) return DynamicFormTypes.TextArea;
    if (/^DATETIME$/.test(type)) return DynamicFormTypes.DateTime;
    if (/^BOOLEAN$/.test(type)) return DynamicFormTypes.Switch;

    logger.warn('[identifyType]', 'type', type, 'cannot identified.');
    return type;
  };

  fetch = (config, name, data) => this.service.fetch(config, name, {
    ...data,
    ...this.getModelConfig(name),
  });

  remove = (config, name, data) => this.service.remove(config, name, {
    ...data,
    ...this.getModelConfig(name),
  });

  upsert = ({ token, schemas }, name, data: { body: any }) => {
    logger.info('[upsert]', 'upsert', name, data);

    const fields = this.getFormSchema(schemas, name);
    logger.info('[upsert]', 'fields is', fields);

    const fixKeys     = _.mapKeys(data.body, (value, key) => _.get(fields, `${key}.ref`, key));
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      if (_.get(fields, `${key}.options.json`) === 'str') {
        return JSON.stringify(value);
      }
      return value;
    });
    logger.info('[upsert]', 'transformed is', transformed);

    const id = R.path(['body', 'id'])(data);
    if (id) {
      return this.service.update({ token }, name, {
        ...data,
        body: transformed,
        id,
        ...this.getModelConfig(name),
      });
    }
    return this.service.insert({ token }, name, {
      ...data,
      body: transformed,
      ...this.getModelConfig(name),
    });
  };

  getModelConfig = (name) => {
    if (name) {
      const config = R.prop(name)(this.modelConfigs);
      if (config) {
        logger.info('[getModelConfig]', name, 'config is', config);
        return config;
      }
      logger.error('[getModelConfig]', `'${name}' not found in`, this.modelConfigs);
      return {};
    }
    return this.modelConfigs;
  };

  getFormSchema = (schemas, name, values) => {
    if (!schemas || !name) {
      logger.error('[getFormSchema]', 'schemas or name is required. schemas is', schemas, 'name is', name);
      return {};
    }
    const schema = R.prop(name)(schemas);

    if (!schema) {
      logger.error('[getFormSchema]', 'schema is required.');
      return {};
    }

    logger.log('[getFormSchema]', 'schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map(formatted => ({ [formatted.name]: formatted })),
      R.map(field => ({
        name   : field.name,
        ref    : R.pathOr(field.name, ['config', 'info', 'ref'])(field),
        type   : this.identifyType(field),
        options: {
          label      : R.path(['config', 'info', 'name'])(field),
          ...R.path(['config', 'info'])(field),
          foreignKeys: R.path(['config', 'foreign_keys'])(field),
        },
        value  : R.prop(field.name)(values),
      })),
    )(schema);
  };

  getFieldsOfAssociations = R.memoize(() => {
    logger.info('[getFieldsOfAssociations]', 'modelConfigs is', this.modelConfigs);
    const concatValues       = (l, r) => (R.is(String, l) ? l : R.uniq(R.concat(l, r)));
    const isNotEmpty         = R.compose(R.not, R.anyPass([R.isEmpty, R.isNil]));
    const associationsFields = R.compose(
      R.reduce(R.mergeDeepWith(concatValues), {}),
      R.filter(isNotEmpty),
      R.values,
      R.map(R.path(['model', 'associations'])),
    )(this.modelConfigs);
    logger.log('[getFieldsOfAssociations]', 'associationsFields is', associationsFields);
    return associationsFields;
  });

  loadModels = ({ token }, name, { pagination = {}, filters, sorter }) => {
    const { current: page, pageSize: size } = pagination;
    return this.service.loadModels({ token }, name, {
      pagination: { page, size },
      ...this.getModelConfig(name),
    });
  };

  loadAssociation = ({ token }, associationName) => {
    if (!associationName) {
      logger.warn('[loadAssociation]', 'associationName is required.');
      return null;
    }

    const fields = R.pathOr([], [associationName, 'fields'])(this.getFieldsOfAssociations());
    return this.service.loadAssociation({ token }, associationName, {
      fields, ...this.getModelConfig(associationName),
    });
  };

  loadSchema = ({ token }, name) =>
    this.service.loadSchema({ token }, name, this.getModelConfig(name));

  // eslint-disable-next-line function-paren-newline
  listAssociationsCallable = ({ token }, associationNames) => Object.assign(
    ...associationNames.map(name => ({ [name]: this.loadAssociation({ token }, name) })));

  // eslint-disable-next-line function-paren-newline
  listSchemasCallable = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, name) })))
}
