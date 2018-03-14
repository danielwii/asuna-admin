import * as R from 'ramda';
import _      from 'lodash';

import { DynamicFormTypes } from '../components/DynamicForm';
import { defaultColumns }   from '../helpers/index';
import { createLogger }     from '../adapters/logger';

const logger = createLogger('adapters:models');

export const modelsProxy = {
  getModelConfigs      : name => global.context.models.getModelConfig(name),
  getAssociationConfigs: name => global.context.models.getAssociationConfigs(name),

  // eslint-disable-next-line function-paren-newline
  getFormSchema: (schemas, name, values) =>
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
  constructor(service, configs = {}, associations = {}) {
    if (!service) {
      throw new Error('service must defined');
    }

    const modelConfigs = R.mapObjIndexed((config, name) => ({
      ...config,
      table: R.path(['tableColumns', name])(configs),
      model: R.path(['modelColumns', name])(configs),
    }))(R.prop('models', configs));

    this.service      = service;
    this.allModels    = Object.keys(modelConfigs);
    this.modelConfigs = modelConfigs;
    this.associations = associations;

    logger.log('[ModelsAdapter]', '[constructor]', { configs, modelConfigs });
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

    // --------------------------------------------------------------
    // identify advanced types
    // --------------------------------------------------------------

    const hasForeignKeys = R.not(R.isEmpty(R.path(['config', 'foreign_keys'])(field)));

    if (hasForeignKeys) {
      return R.not(R.path(['config', 'many'])(field))
        ? DynamicFormTypes.Association
        : DynamicFormTypes.ManyToMany;
    }

    const advancedType = R.path(['config', 'info', 'type'])(field);

    if (/^RichText$/i.test(advancedType)) return DynamicFormTypes.RichText;
    if (/^Image$/i.test(advancedType)) return DynamicFormTypes.Image;
    if (/^Images$/i.test(advancedType)) return DynamicFormTypes.Images;
    if (/^Video$/i.test(advancedType)) return DynamicFormTypes.Video;
    if (/^Authorities$/i.test(advancedType)) return DynamicFormTypes.Authorities;
    if (/^EnumFilter$/i.test(advancedType)) return DynamicFormTypes.EnumFilter;
    if (/^Enum$/i.test(advancedType)) return DynamicFormTypes.Enum;

    // --------------------------------------------------------------
    // identify basic types
    // --------------------------------------------------------------

    const type = R.path(['config', 'type'])(field);

    if (/^VARCHAR.+$/.test(type)) return DynamicFormTypes.Input;
    if (/^INTEGER|FLOAT$/.test(type)) return DynamicFormTypes.InputNumber;
    if (/^TEXT$/.test(type)) return DynamicFormTypes.TextArea;
    if (/^DATETIME$/.test(type)) return DynamicFormTypes.DateTime;
    if (/^DATE$/.test(type)) return DynamicFormTypes.Date;
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

  upsert = ({ token, schemas }, name, data) => {
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

  getAssociationConfigs = name => R.prop(name)(this.associations);

  getModelConfig = (name) => {
    if (name) {
      const config = R.prop(name)(this.modelConfigs);
      if (config) {
        logger.info('[getModelConfig]', name, 'config is', config);

        // 未定义具体模型时，使用默认定义
        if (!config.model) {
          config.model = {};
        }
        if (!config.table) {
          config.table = defaultColumns;
        }

        return config;
      }
      logger.warn('[getModelConfig]', `'${name}' not found in`, this.modelConfigs, 'generate a default one.');
      return { model: {}, table: defaultColumns };
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
      logger.error('[getFormSchema]', 'schema is required.', schemas);
      return {};
    }

    logger.log('[getFormSchema]', 'schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map(formatted => ({ [formatted.name]: formatted })),
      R.map((field) => {
        const ref = R.pathOr(field.name, ['config', 'info', 'ref'])(field);
        return ({
          name   : ref || field.name,
          ref,
          type   : this.identifyType(field),
          options: {
            label      : R.path(['config', 'info', 'name'])(field),
            ...R.path(['config', 'info'])(field),
            foreignKeys: R.path(['config', 'foreign_keys'])(field),
            required   : R.not(R.pathOr(true, ['config', 'nullable'])(field)),
          },
          value  : R.prop(field.name)(values),
        });
      }),
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

  // eslint-disable-next-line no-unused-vars
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

    const defaultFields = R.pathOr(['id', 'name'], [associationName, 'fields'])(this.associations);
    const fields        = R.pathOr(defaultFields, [associationName, 'fields'])(this.getFieldsOfAssociations());
    logger.info('[loadAssociation]', {
      defaultFields, fields, associationName, associations: this.associations,
    });
    return this.service.loadAssociation({ token }, associationName, {
      fields, ...this.getModelConfig(associationName),
    });
  };

  loadSchema = ({ token }, name) =>
    this.service.loadSchema({ token }, name, this.getModelConfig(name));

  // eslint-disable-next-line function-paren-newline
  listAssociationsCallable = ({ token }, associationNames) => Object.assign(
    ...associationNames.map(name => ({ [name]: this.loadAssociation({ token }, name) })),
  );

  // eslint-disable-next-line function-paren-newline
  listSchemasCallable = ({ token }) => Object.assign(
    ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, name) })),
  )
}
