import * as R from 'ramda';
import * as _ from 'lodash';
import { AxiosResponse } from 'axios';

import { DynamicFormTypes } from '../components/DynamicForm';
import { appContext } from '../app/context';

import { defaultColumns } from '../helpers';
import { TablePagination } from './response';
import { createLogger, lv } from '../helpers/logger';
import { config } from '../app/configure';

export interface IModelBody {
  id?: number | string;

  [key: string]: any;
}

export interface IModelService {
  loadModels(
    authToken: { token: string },
    name: string,
    configs?: {
      relations?: string[];
      pagination?: Asuna.Pageable;
      filters?;
      sorter?;
    } & Asuna.Schema.ModelOpt,
  );

  loadSchema(authToken: { token: string }, payload: { name: string }, data);

  fetch(
    authToken: { token: string },
    name: string,
    data: { endpoint?: string; id: number; profile?: string },
  );

  remove(authToken: { token: string }, name: string, data: { endpoint?: string; id: number });

  insert(
    authToken: { token: string; schemas?: {} },
    name: string,
    data: { endpoint?: string; body: IModelBody } & Asuna.Schema.ModelConfig,
  );

  update(
    authToken: { token: string },
    name: any,
    data: { endpoint?: string; id: number | string; body: IModelBody } & Asuna.Schema.ModelConfig,
  );

  loadAssociation(
    authToken: { token: string },
    associationName: string,
    data: Asuna.Schema.ModelOpt & { fields: string[] },
  );
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:models', lv.warn);

export interface ModelListConfig {
  endpoint?: string;
  pagination?: TablePagination;
  filters?;
  sorter?: Sorter | null;
  relations?: string[];
}

interface IModelProxy {
  getModelConfig(name: string): Asuna.Schema.ModelConfig;

  getAssociationConfigs(name: string): any;

  getFormSchema(schemas, name: string, values?): any;

  getFieldsOfAssociations(): any;

  loadModels(auth: { token: string }, name: string, configs?: ModelListConfig): any;

  loadSchema(auth: { token }, data: { name }): any;

  listSchemasCallable(auth: { token }): any;

  listAssociationsCallable(auth: { token }, associationNames: string[]): any;

  fetch(auth: { token }, name, data): any;

  remove(auth: { token }, name, data): any;

  upsert(
    auth: { token: string; schemas? },
    name: string,
    data: { body: IModelBody },
  ): Promise<AxiosResponse>;
}

export const modelProxy: IModelProxy = {
  getModelConfig: (name: string): Asuna.Schema.ModelConfig =>
    appContext.ctx.models.getModelConfig(name),

  getAssociationConfigs: name => appContext.ctx.models.getAssociationConfigs(name),

  getFormSchema: (schemas, name, values) =>
    appContext.ctx.models.getFormSchema(schemas, name, values),

  getFieldsOfAssociations: () => appContext.ctx.models.getFieldsOfAssociations(),

  /**
   * load schema list
   * @param auth
   * @param name
   * @param configs
   * @returns {*}
   */
  loadModels: (auth, name, configs) => {
    logger.log('[modelProxy.loadModels]', { auth, name, configs });
    return appContext.ctx.models.loadModels(auth, name, configs);
  },

  /**
   * load definition of schema
   * @param token
   * @param name
   * @returns {*}
   */
  loadSchema: ({ token }, { name }) => appContext.ctx.models.loadSchema({ token }, { name }),

  /**
   * load all schemas
   * @param token
   * @returns {*}
   */
  listSchemasCallable: ({ token }) => appContext.ctx.models.listSchemasCallable({ token }),

  listAssociationsCallable: ({ token }, associationNames) =>
    appContext.ctx.models.listAssociationsCallable({ token }, associationNames),

  fetch: ({ token }, name, data) => appContext.ctx.models.fetch({ token }, name, data),

  remove: ({ token }, name, data) => appContext.ctx.models.remove({ token }, name, data),

  /**
   * update model if id exists in body, insert new one or else.
   * @param {token}    - { token }
   * @param name       - model name
   * @param data       - model body
   * @returns {*}
   */
  upsert: (
    { token, schemas }: { token: string; schemas? },
    name: string,
    data: { body: IModelBody },
  ): Promise<AxiosResponse> => appContext.ctx.models.upsert({ token, schemas }, name, data),
};

export class ModelAdapter implements IModelProxy {
  private service: IModelService;
  private allModels: string[];
  private modelConfigs: Asuna.Schema.ModelConfigs;
  private associations: {};

  /**
   * @param service
   * @param configs      - models: 模型定义; tableColumns: 模型列表定义; modelColumns: 模型表单定义
   *                       模型定义中出现的的元素才会作为最终元素
   * @param associations
   */
  constructor(
    service: IModelService,
    configs: Asuna.Schema.ModelOpts = {},
    associations: Asuna.Schema.Associations = {},
  ) {
    logger.log('[ModelAdapter][constructor]', { service, configs, associations });
    if (!service) {
      throw new Error('service must defined');
    }

    const modelConfigs = R.mapObjIndexed((config, name) => ({
      ...config,
      table: R.path(['tableColumns', name])(configs),
      model: R.path(['modelColumns', name])(configs),
    }))(R.prop('models', configs));

    this.service = service;
    this.allModels = Object.keys(modelConfigs);
    this.modelConfigs = modelConfigs;
    this.associations = associations;

    logger.log('[ModelAdapter]', '[constructor]', { configs, modelConfigs });
    R.forEachObjIndexed((config, name) => {
      logger.info('[ModelAdapter][constructor]', 'check', name, config);
      if (!config.table) logger.info('[ModelAdapter]', '[constructor]', name, 'should set table');
      if (!config.model) logger.info('[ModelAdapter]', '[constructor]', name, 'should set model');
    })(modelConfigs);
  }

  identifyType = field => {
    if (['id', 'created_at', 'updated_at'].indexOf(field.name) > -1) {
      return DynamicFormTypes.Plain;
    }

    // --------------------------------------------------------------
    // identify advanced types
    // --------------------------------------------------------------

    const hasForeignKeys = R.path(['config', 'selectable'], field);

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

    if (/^(VARCHAR.*|String)$/i.test(type)) return DynamicFormTypes.Input;
    if (/^(INTEGER|FLOAT|Number)$/i.test(type)) return DynamicFormTypes.InputNumber;
    if (/^TEXT$/i.test(type)) return DynamicFormTypes.TextArea;
    if (/^DATETIME$/i.test(type)) return DynamicFormTypes.DateTime;
    if (/^DATE$/i.test(type)) return DynamicFormTypes.Date;
    if (/^BOOLEAN$/i.test(type)) return DynamicFormTypes.Switch;

    logger.warn('[identifyType]', 'type', type, 'cannot identified.');
    return type;
  };

  fetch = (config, name, data) =>
    this.service.fetch(config, name, {
      ...data,
      ...(this.getModelConfig(name) as Asuna.Schema.ModelOpt),
    });

  remove = (config, name, data) =>
    this.service.remove(config, name, {
      ...data,
      ...(this.getModelConfig(name) as Asuna.Schema.ModelOpt),
    });

  // FIXME schemas can be found by storeConnector now.
  upsert = (
    { token, schemas },
    name: string,
    data: { body: IModelBody },
  ): Promise<AxiosResponse> => {
    logger.info('[upsert]', 'upsert', { name, data });

    const allSchemas = schemas || appContext.store.select(R.path(['models', 'schemas']));

    const fields = this.getFormSchema(allSchemas, name);
    logger.info('[upsert]', 'fields is', fields);

    const fixKeys = _.mapKeys(data.body, (value, key) => _.get(fields, `${key}.ref`, key));
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      return _.get(fields, `${key}.options.json`) === 'str' ? JSON.stringify(value) : value;
    });
    logger.info('[upsert]', 'transformed is', transformed);

    const id = R.path(['body', 'id'])(data);
    if (id) {
      return this.service.update({ token }, name, {
        ...data,
        body: transformed,
        id,
        ...(this.getModelConfig(name) as Asuna.Schema.ModelOpt),
      });
    }
    return this.service.insert({ token }, name, {
      ...data,
      body: transformed,
      ...(this.getModelConfig(name) as Asuna.Schema.ModelOpt),
    });
  };

  getAssociationConfigs = name => R.prop(name)(this.associations);

  getModelConfig = (name): Asuna.Schema.ModelConfig => {
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
    logger.warn(
      '[getModelConfig]',
      `'${name}' not found in`,
      this.modelConfigs,
      'generate a default one.',
    );
    return { model: {}, table: defaultColumns };
  };

  getFormSchema = (
    schemas: Asuna.Schema.ModelSchemas,
    name: string,
    values?: { [member: string]: any },
  ): Asuna.Schema.FormSchemas => {
    if (!schemas || !name) {
      logger.error('[getFormSchema]', 'schemas or name is required.', { schemas, name });
      return {};
    }
    const schema = R.prop(name)(schemas);

    if (!schema) {
      logger.error('[getFormSchema]', 'schema is required.', { schemas, name });
      return {};
    }

    logger.log('[getFormSchema]', 'schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll,
      R.map((formatted: Asuna.Schema.FormSchema) => ({ [formatted.name]: formatted })),
      R.map(
        (field: Asuna.Schema.ModelSchema): Asuna.Schema.FormSchema => {
          const ref = R.pathOr(field.name, ['config', 'info', 'ref'])(field);
          const length = R.path(['config', 'length'])(field);
          const required = R.not(R.pathOr(true, ['config', 'nullable'])(field));
          return {
            name: ref || field.name,
            ref,
            type: this.identifyType(field),
            options: {
              ...R.path(['config', 'info'])(field),
              length: length ? +length : null,
              label: R.pathOr(null, ['config', 'info', 'name'])(field),
              // foreignKeys: R.path(['config', 'foreignKeys'])(field), // @deprecated
              selectable: R.path<string>(['config', 'selectable'])(field),
              required: required || R.pathOr(false, ['config', 'info', 'required'])(field),
              ...R.path(['model', 'settings', field.name], this.getModelConfig(name)),
            },
            // 不存在时返回 undefined，而不能返回 null
            // null 会被当作值在更新时被传递
            value: values ? R.prop(field.name)(values) : undefined,
          };
        },
      ),
    )(schema) as { [member: string]: Asuna.Schema.FormSchema };
  };

  getFieldsOfAssociations = R.memoize(() => {
    logger.info('[getFieldsOfAssociations]', 'modelConfigs is', this.modelConfigs);
    const concatValues = (l, r) => (R.is(String, l) ? l : R.uniq(R.concat(l, r)));
    const isNotEmpty = R.compose(
      R.not,
      R.anyPass([R.isEmpty, R.isNil]),
    );
    const associationsFields = R.compose(
      R.reduce(R.mergeDeepWith(concatValues), {}),
      R.filter(isNotEmpty),
      R.values,
      R.map(R.path(['model', 'associations'])),
    )(this.modelConfigs as any);
    logger.log('[getFieldsOfAssociations]', 'associationsFields is', associationsFields);
    return associationsFields;
  });

  public loadModels(auth: { token: string }, name: string, configs?: ModelListConfig): any {
    logger.info('[loadModels]', { name, configs, modelConfig: this.getModelConfig(name) });
    const page = R.pathOr(1, ['pagination', 'current'], configs);
    const size = R.pathOr(config.get('DEFAULT_PAGE_SIZE'), ['pagination', 'pageSize'], configs);
    return this.service.loadModels(auth, name, {
      pagination: { page, size },
      sorter: configs && configs.sorter,
      relations: configs && configs.relations,
      ...(this.getModelConfig(name) as Asuna.Schema.ModelOpt),
    });
  }

  loadAssociation = ({ token }, associationName) => {
    if (!associationName) {
      logger.warn('[loadAssociation]', 'associationName is required.');
      return null;
    }

    const defaultFields = R.pathOr(['id', 'name'], [associationName, 'fields'])(this.associations);
    const fields = R.pathOr(defaultFields, [associationName, 'fields'])(
      this.getFieldsOfAssociations(),
    );
    logger.info('[loadAssociation]', {
      defaultFields,
      fields,
      associationName,
      associations: this.associations,
    });
    return this.service.loadAssociation({ token }, associationName, {
      fields,
      ...(this.getModelConfig(associationName) as Asuna.Schema.ModelOpt),
    });
  };

  loadSchema = ({ token }, name) =>
    this.service.loadSchema({ token }, name, this.getModelConfig(name) as Asuna.Schema.ModelOpt);

  listAssociationsCallable = ({ token }, associationNames) =>
    Object.assign(
      {},
      ...associationNames.map(name => ({ [name]: this.loadAssociation({ token }, name) })),
    );

  listSchemasCallable = ({ token }) =>
    Object.assign(
      {},
      ...this.allModels.map(name => ({ [name]: this.loadSchema({ token }, name) })),
    );
}
