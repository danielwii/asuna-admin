import * as R from 'ramda';
import * as _ from 'lodash';
import { AxiosResponse } from 'axios';

import { DynamicFormTypes } from '../components/DynamicForm';
import { TablePagination } from './response';

import { defaultColumns } from '@asuna-admin/helpers';
import { AppContext } from '@asuna-admin/core';
import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';
import { AuthState } from '@asuna-admin/store';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IModelBody {
  id?: number | string;

  [key: string]: any;
}

export interface IModelService {
  loadModels(
    auth: { token: string | null },
    modelName: string,
    configs?: {
      relations?: string[];
      pagination?: Asuna.Pageable;
      filters?;
      sorter?;
    } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  loadSchema(
    auth: { token: string | null },
    payload: { name: string },
    data,
  ): Promise<AxiosResponse>;

  fetch(
    auth: { token: string | null },
    modelName: string,
    data: { endpoint?: string; id: number; profile?: Asuna.Profile },
  ): Promise<AxiosResponse>;

  remove(
    auth: { token: string | null },
    modelName: string,
    data: { endpoint?: string; id: number },
  ): Promise<AxiosResponse>;

  insert(
    auth: { token: string | null; schemas?: {} },
    modelName: string,
    data: { endpoint?: string; body: IModelBody } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  update(
    auth: { token: string | null },
    modelName: any,
    data: { endpoint?: string; id: number | string; body: IModelBody } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  loadAssociation(
    auth: { token: string | null },
    associationName: string,
    data: Asuna.Schema.ModelConfig & {
      fields: string[];
      keywords: string | null;
      page?: number;
    },
  ): Promise<AxiosResponse | AxiosResponse[]>;

  loadAssociationByIds(
    auth: AuthState,
    associationName: string,
    data: Asuna.Schema.ModelConfig & { fields: string[]; ids: string[] | number[] },
  ): Promise<AxiosResponse>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:models', 'warn');

export interface ModelListConfig {
  endpoint?: string;
  pagination?: TablePagination;
  filters?;
  sorter?: Sorter | null;
  relations?: string[];
}

/**
 * @deprecated use AppContext.adapters.models instead
 */
export const modelProxy = {
  getModelConfig(modelName: string): Asuna.Schema.ModelConfig {
    return AppContext.ctx.models.getModelConfig(modelName);
  },

  getAssociationConfigs(modelName: string): any {
    return AppContext.ctx.models.getAssociationConfigs(modelName);
  },

  getFormSchema(schemas, modelName: string, values?): any {
    return AppContext.ctx.models.getFormSchema(schemas, modelName, values);
  },

  getFieldsOfAssociations(): any {
    return AppContext.ctx.models.getFieldsOfAssociations();
  },

  /**
   * load schema list
   * @param modelName
   * @param configs
   * @returns {*}
   */
  loadModels(modelName: string, configs?: ModelListConfig): any {
    logger.log('[modelProxy.loadModels]', { modelName, configs });
    return AppContext.ctx.models.loadModels(modelName, configs);
  },

  /**
   * load definition of schema
   * @param data
   * @returns {*}
   */
  loadSchema(data: { name }): any {
    return AppContext.ctx.models.loadSchema(data);
  },

  /**
   * load all schemas
   * @returns {*}
   */
  listSchemasCallable(): any {
    return AppContext.ctx.models.listSchemasCallable();
  },

  listAssociationsCallable(associationNames: string[]): any {
    return AppContext.ctx.models.listAssociationsCallable(associationNames);
  },

  fetch(modelName, data: { endpoint?: string; id: number; profile?: Asuna.Profile }): any {
    return AppContext.ctx.models.fetch(modelName, data);
  },

  remove(modelName, data): any {
    return AppContext.ctx.models.remove(modelName, data);
  },

  /**
   * update model if id exists in body, insert new one or else.
   * @param modelName - model name
   * @param data - model body
   * @returns {*}
   */

  upsert: (modelName: string, data: { body: IModelBody }): Promise<AxiosResponse> => {
    return AppContext.ctx.models.upsert(modelName, data);
  },
};

export class ModelAdapter {
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
      logger.debug('[ModelAdapter][constructor]', 'check', name, config);
      if (!config.table) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set table');
      if (!config.model) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set model');
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

  fetch = (modelName: string, data) => {
    const auth = AppContext.fromStore('auth');
    return this.service.fetch(auth, modelName, {
      ...data,
      ...this.getModelConfig(modelName),
    });
  };

  remove = (modelName: string, data) => {
    const auth = AppContext.fromStore('auth');
    return this.service.remove(auth, modelName, {
      ...data,
      ...this.getModelConfig(modelName),
    });
  };

  upsert = (modelName: string, data: { body: IModelBody }): Promise<AxiosResponse> => {
    const auth = AppContext.fromStore('auth');
    const { schemas } = AppContext.fromStore('models');
    logger.debug('[upsert]', 'upsert', { modelName, data });

    const allSchemas = schemas || AppContext.store.select(R.path(['models', 'schemas']));

    const fields = this.getFormSchema(allSchemas, modelName);
    logger.debug('[upsert]', 'fields is', fields);

    const fixKeys = _.mapKeys(data.body, (value, key) => _.get(fields, `${key}.ref`, key));
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      return _.get(fields, `${key}.options.json`) === 'str' ? JSON.stringify(value) : value;
    });
    logger.debug('[upsert]', 'transformed is', transformed);

    const id = R.path(['body', 'id'])(data);
    if (id) {
      return this.service.update(auth, modelName, {
        ...data,
        body: transformed,
        id,
        ...this.getModelConfig(modelName),
      });
    }
    return this.service.insert(auth, modelName, {
      ...data,
      body: transformed,
      ...this.getModelConfig(modelName),
    });
  };

  getAssociationConfigs = modelName => R.prop(modelName)(this.associations);

  getModelConfig = (modelName): Asuna.Schema.ModelConfig => {
    const config = R.prop(modelName)(this.modelConfigs);
    if (config) {
      logger.debug('[getModelConfig]', modelName, 'config is', config);

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
      `'${modelName}' not found in`,
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

  public getFieldsOfAssociations = R.memoize(() => {
    logger.debug('[getFieldsOfAssociations]', 'modelConfigs is', this.modelConfigs);
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

  public loadModels = (modelName: string, configs?: ModelListConfig): any => {
    logger.debug('[loadModels]', {
      modelName,
      configs,
      modelConfig: this.getModelConfig(modelName),
    });
    const page = R.pathOr(1, ['pagination', 'current'], configs);
    const size = R.pathOr(Config.get('DEFAULT_PAGE_SIZE'), ['pagination', 'pageSize'], configs);
    const auth = AppContext.fromStore('auth');
    return this.service.loadModels(auth, modelName, {
      pagination: { page, size },
      sorter: configs && configs.sorter,
      relations: configs && configs.relations,
      ...this.getModelConfig(modelName),
    });
  };

  private getFieldsOfAssociation(associationName: string): string[] {
    const defaultFields = R.pathOr(['id', 'name'], [associationName, 'fields'])(this.associations);
    return R.pathOr(defaultFields, [associationName, 'fields'])(this.getFieldsOfAssociations());
  }

  public loadAssociationByIds = (
    associationName: string,
    ids: string[] | number[],
  ): Promise<AxiosResponse> => {
    if (_.trim(associationName) && !_.isEmpty(ids)) {
      logger.debug('[loadAssociationByIds]', { associationName, ids });

      const fields = this.getFieldsOfAssociation(associationName);
      const auth = AppContext.fromStore('auth');
      return this.service.loadAssociationByIds(auth, associationName, {
        ids,
        fields,
        ...this.getModelConfig(associationName),
      });
    }
    return Promise.reject();
  };

  public loadAssociation = (
    associationName,
    configs: { keywords: string | null; page?: number } = { keywords: '' },
  ): Promise<AxiosResponse | AxiosResponse[]> => {
    if (!associationName) {
      logger.warn('[loadAssociation]', 'associationName is required.');
      return Promise.reject();
    }

    const fields = this.getFieldsOfAssociation(associationName);
    logger.debug('[loadAssociation]', { fields, associationName, associations: this.associations });
    const auth = AppContext.fromStore('auth');
    return this.service.loadAssociation(auth, associationName, {
      ...configs,
      fields,
      ...this.getModelConfig(associationName),
    });
  };

  public loadSchema = modelName => {
    const auth = AppContext.fromStore('auth');
    return this.service.loadSchema(auth, modelName, this.getModelConfig(modelName));
  };

  public listAssociationsCallable = associationNames =>
    Object.assign({}, ...associationNames.map(name => ({ [name]: this.loadAssociation(name) })));

  public listSchemasCallable = () =>
    Object.assign(
      {},
      ...this.allModels.map(modelName => ({ [modelName]: this.loadSchema(modelName) })),
    );
}
