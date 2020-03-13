import { DynamicFormTypes } from '@asuna-admin/components';
import { Config } from '@asuna-admin/config';
import { AppContext, AsunaDefinitions, CacheHelper } from '@asuna-admin/core';
import {
  BatchLoader,
  castModelKey,
  defaultColumns,
  defaultColumnsByPrimaryKey,
  parseJSONIfCould,
  RelationColumnProps,
  TenantHelper,
} from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { AuthState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import { Condition, WhereConditions } from '@asuna-admin/types/meta';
import { message } from 'antd';

import { PaginationConfig } from 'antd/es/pagination';
import { AxiosResponse } from 'axios';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import NodeCache, { NodeCacheLegacyCallbacks } from 'node-cache';
import * as R from 'ramda';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

export interface IModelBody {
  id?: number | string;
  [key: string]: any;
}

export interface RestListQuery {
  fields?: string[];
  keywords?: string | null;
  page?: number;
  size?: number;
}

export interface IModelService {
  loadModels(
    auth: { token: string | null },
    modelName: string,
    configs: {
      relations?: string[];
      fields?: string[];
      pagination?: Asuna.Pageable;
      filters?: WhereConditions;
      sorter?: any;
    } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  /**
   * @deprecated {@see loadOriginSchema}
   * @param auth
   * @param modelName
   * @param data
   */
  loadSchema(auth: { token: string | null }, modelName: string, data): Promise<AxiosResponse>;

  loadOriginSchema(auth: { token: string | null }, modelName: string, data): Promise<AxiosResponse>;

  fetch(
    auth: { token: string | null },
    modelName: string,
    data: {
      endpoint?: string;
      id: string | number;
      profile?: Asuna.Profile;
      /**
       * 包含关联字符串列表，该列表中不包含 schema 中 accessible 未 hidden 的关联
       */
      relations?: string[];
    } & Asuna.Schema.ModelConfig,
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
    data: {
      endpoint?: string;
      id: number | string;
      // 主键的名称可能不是 id，这里的 id 代表值，primaryKey 代编键的名称
      primaryKey?: string;
      body: IModelBody;
    } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  loadAssociation(
    auth: { token: string | null },
    associationName: string,
    data: Asuna.Schema.ModelConfig & RestListQuery,
  ): Promise<AxiosResponse | AxiosResponse[]>;

  loadAssociationByIds(
    auth: AuthState,
    associationName: string,
    data: Asuna.Schema.ModelConfig & { fields: string[]; ids: string[] | number[] },
  ): Promise<AxiosResponse>;

  uniq(
    { auth, modelConfig }: { auth: AuthState; modelConfig: Asuna.Schema.ModelConfig },
    modelName: string,
    data: { column: string },
  ): Promise<AxiosResponse>;

  groupCounts(
    { auth, modelConfig }: { auth: AuthState; modelConfig: Asuna.Schema.ModelConfig },
    modelName: string,
    data: { column: string; where: string },
  ): Promise<AxiosResponse<{ [id: string]: { [name: string]: number } }>>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:models');

export interface ModelListConfig {
  endpoint?: string;
  fields?: string[];
  // distinct?: boolean;
  pagination?: PaginationConfig;
  filters?: Record<string, [Condition]>;
  sorter?: Sorter | null;
  relations?: string[];
}

export interface ModelAdapter {
  fetch2<T>(
    modelName: string,
    data: {
      endpoint?: string;
      id: string | number;
      profile?: Asuna.Profile;
      /**
       * 包含关联字符串列表，该列表中不包含 schema 中 accessible 未 hidden 的关联
       */
      relations?: string[];
    } & Asuna.Schema.ModelConfig,
  ): Promise<T>;
  getPrimaryKey(modelName: string): string;
  loadModels2<T>(
    modelName: string,
    configs?: {
      relations?: string[];
      fields?: string[];
      pagination?: Asuna.Pageable;
      filters?: WhereConditions;
      sorter?: any;
    } & Asuna.Schema.ModelConfig,
  ): Promise<Asuna.PageableResponse<T>>;
  uniq(modelName: string, column: string, where?: object): Promise<string[]>;
  groupCounts(modelName: string, column: string, relation: string, id: string): Promise<{ [name: string]: number }>;
  loadOriginSchema(modelName: string): Promise<Asuna.Schema.OriginSchema>;
  getColumns(
    modelName: string,
    opts: { callRefresh: () => void; actions: (text, record, extras) => any },
    extraName?: string,
  ): Promise<RelationColumnProps[]>;
}

export class ModelAdapterImpl implements ModelAdapter {
  private readonly cache: NodeCacheLegacyCallbacks = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  private service: IModelService;
  private allModels: string[];
  readonly modelConfigs: { [K: string]: Asuna.Schema.ModelConfig };
  readonly associations: { [key: string]: Asuna.Schema.Association };
  readonly columnOpts: { [key: string]: Asuna.Schema.ColumnOpts<any> };
  /**
   * @param service
   * @param definitions - models: 模型定义; tableColumns: 模型列表定义; modelColumns: 模型表单定义
   *                      模型定义中出现的的元素才会作为最终元素
   */
  constructor(service: IModelService, definitions: AsunaDefinitions) {
    logger.log('[ModelAdapter][constructor]', { service, definitions });
    if (!service) {
      throw new Error('service must defined');
    }

    this.service = service;
    this.allModels = Object.keys(definitions.modelOpts);
    this.modelConfigs = definitions.modelConfigs;
    this.associations = definitions.associations;
    this.columnOpts = definitions.columnOpts;

    logger.log('[ModelAdapter]', '[constructor]', this.modelConfigs);
    _.map(this.modelConfigs, (config, name) => {
      logger.debug('[ModelAdapter][constructor]', 'check', name, config);
      if (!config.table) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set table');
      if (!config.model) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set model');
    });
  }
  identifyType = (modelName: string, field: Asuna.Schema.ModelSchema): DynamicFormTypes | undefined => {
    const primaryKeys = this.getPrimaryKeys(modelName);
    const plainKeys = _.map(primaryKeys.concat('created_at', 'updated_at'), castModelKey);
    const basicType = field?.config?.type ?? '';
    const advanceType = field?.config?.info?.type as any;
    const notFound = (): undefined => {
      const info = { plainKeys, basicType, advanceType };
      logger.warn('[identifyType]', 'type cannot identified.', field, info);
      return basicType || advanceType;
    };
    return _.cond<Asuna.Schema.ModelSchema, DynamicFormTypes | undefined>([
      // --------------------------------------------------------------
      // plain types
      // --------------------------------------------------------------
      [_.conforms({ name: R.contains(R.__, plainKeys) }), _.constant(DynamicFormTypes.Plain)],
      // --------------------------------------------------------------
      // association types
      // --------------------------------------------------------------
      [
        () => !!field?.config?.selectable,
        () => (field?.config?.many ? DynamicFormTypes.ManyToMany : DynamicFormTypes.Association),
      ],
      // --------------------------------------------------------------
      // identify advanced types
      // --------------------------------------------------------------
      [
        () => !!advanceType,
        () =>
          _.cond([
            [() => !!DynamicFormTypes[advanceType], () => DynamicFormTypes[advanceType]],
            [_.stubTrue, notFound],
          ])(advanceType),
      ],
      // --------------------------------------------------------------
      // basic types
      // --------------------------------------------------------------
      [
        () => !!basicType,
        () =>
          _.cond([
            [() => /^(VARCHAR.*|String)$/i.test(basicType), () => DynamicFormTypes.Input],
            [() => /^(INTEGER|FLOAT|Number|Numeric|Double.*)$/i.test(basicType), () => DynamicFormTypes.InputNumber],
            [() => /^TEXT$/i.test(basicType), () => DynamicFormTypes.TextArea],
            [() => /^DATETIME$/i.test(basicType), () => DynamicFormTypes.DateTime],
            [() => /^DATE$/i.test(basicType), () => DynamicFormTypes.Date],
            [() => /^BOOLEAN$/i.test(basicType), () => DynamicFormTypes.Switch],
            [() => /^JSON$/i.test(basicType), () => DynamicFormTypes.JSON],
            [_.stubTrue, notFound],
          ])(basicType),
      ],
      [_.stubTrue, notFound],
    ])(field);
  };

  uniq(modelName: string, column: string): Promise<string[]> {
    const auth = AppContext.fromStore('auth');
    const modelConfig = this.getModelConfig(modelName);
    return this.service.uniq({ auth, modelConfig }, modelName, { column }).then(fp.get('data'));
  }

  _groupCountsBatchLoader = new BatchLoader<{ modelName; column; relation; id: string }, any>(
    keys => {
      const { modelName, column, relation } = keys[0];
      const auth = AppContext.fromStore('auth');
      const modelConfig = this.getModelConfig(modelName);
      const ids = _.map(keys, fp.get('id'));
      const where = JSON.stringify({ [relation]: { $in: ids } });
      return this.service.groupCounts({ auth, modelConfig }, modelName, { column, where }).then(fp.get('data'));
    },
    {
      extractor: (data, key) => _.get(data, key?.id),
    },
  );
  async groupCounts(
    modelName: string,
    column: string,
    relation: string,
    id: string,
  ): Promise<{ [name: string]: number }> {
    // const auth = AppContext.fromStore('auth');
    // const modelConfig = this.getModelConfig(modelName);
    return this._groupCountsBatchLoader.load({ modelName, column, relation, id }).catch(console.error);
  }

  fetch2<T = any>(
    modelName: string,
    data: {
      endpoint?: string;
      id: string | number;
      profile?: Asuna.Profile;
      /**
       * 包含关联字符串列表，该列表中不包含 schema 中 accessible 未 hidden 的关联
       */
      relations?: string[];
    },
  ): Promise<T> {
    return this.fetch(modelName, data).then(fp.get('data'));
  }

  /**
   * 加载 model 信息，profile 定义了要加载的模型形式
   * 同时，由于实际上关联模型会产生过多的附加信息，这里考虑了两种优化模式
   * 1. 依据 schema 中定义的 accessible 信息，只加载有限的关联
   * 2. 采用更加丰富的关联数据加载组件，已应对大数据库量的加载需求
   * @deprecated fetch2
   */
  fetch = (
    modelName: string,
    data: { endpoint?: string; id: string | number; profile?: Asuna.Profile; relations?: string[] },
  ): Promise<AxiosResponse> => {
    logger.log('[fetch]', { modelName, data });
    if (!data?.id) {
      message.error(`id must be provided.`);
      return Promise.reject(`id must be provided.`);
    }

    const auth = AppContext.fromStore('auth');
    const modelConfig = this.getModelConfig(modelName);
    const schema = this.getFormSchema(modelName);
    const selectableRelations = _.chain(schema)
      .pickBy(fp.get('options.selectable'))
      // .pickBy(_.flow([fp.get('options.accessible'), fp.negate(fp.eq('hidden'))]))
      .pickBy(opts => !_.includes(_.get(opts, 'options.accessible'), ['hidden']))
      .keys()
      .value();
    const relations = _.flow(_.flattenDeep, _.uniq, fp.join(','))([selectableRelations, data.relations]);
    logger.log({ schema, selectableRelations, data, relations });
    return this.service.fetch(auth, modelName, Object.assign(data, modelConfig, { relations }));
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
    // const { schemas } = AppContext.fromStore('models');
    logger.debug('[upsert]', 'upsert', { modelName, data });

    // const allSchemas = schemas || AppContext.store.select(R.path(['models', 'schemas']));

    const fields = this.getFormSchema(modelName);
    const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
    logger.debug('[upsert]', 'fields is', fields);

    const fixKeys = _.mapKeys(data?.body, (value, key) => fields?.[key]?.ref || key);
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      return _.eq(fields?.[key]?.options?.json, 'str') ? JSON.stringify(value) : value;
    });
    logger.debug('[upsert]', 'transformed is', transformed);

    const id = data?.body?.[primaryKey] as any;
    if (id) {
      return this.service.update(auth, modelName, {
        id,
        primaryKey,
        body: transformed,
        ...data,
        ...this.getModelConfig(modelName),
      });
    }
    return this.service.insert(auth, modelName, {
      ...data,
      body: transformed,
      ...this.getModelConfig(modelName),
    });
  };

  getAssociationConfigs = (modelName: string) => R.prop(modelName)(this.associations);

  getColumns = async (
    modelName: string,
    opts: { callRefresh: () => void; actions: (text, record, extras) => any },
    extraName?: string,
  ): Promise<RelationColumnProps[]> => {
    logger.log('[getColumns]', { modelName, extraName, opts });
    const formSchema = this.getFormSchema(modelName);
    const { table: columnsRender } = this.getModelConfig(extraName || modelName);
    const readonly = !TenantHelper.enableModelPublishForCurrentUser(modelName);
    const columns = columnsRender
      ? await Promise.all(columnsRender(opts.actions, { modelName, callRefresh: opts.callRefresh, readonly }))
      : [];

    return _.map(columns, (column: RelationColumnProps) => {
      // 不检测不包含在 schema 中且不属于模型的列名
      const isRelationKey = (column.key as string).includes('.');
      const isActionKey = _.includes(['action'], column.key);
      return column.key && !formSchema[column.key] && !isActionKey && !isRelationKey
        ? // 标记 schema 中不存在的列 TODO maybe custom
          { ...column, title: `${column.title}❓` }
        : column;
    });
    /*
    return _.filter<any>(
      columns,
      (column: RelationColumnProps) => !(column.key && !formSchema[column.key] && !_.includes(['action'], column.key)),
    );
*/
  };

  getColumnOpts = (key: string): Asuna.Schema.ColumnOpts<any> => this.columnOpts[key];

  getModelConfig = (modelName: string): Asuna.Schema.ModelConfig => {
    const TAG = '[getModelConfig]';
    const config = this.modelConfigs[modelName];
    if (config) {
      // logger.debug(TAG, modelName, 'config is', config);

      // 未定义具体模型时，使用默认定义
      config.model = config.model || {};
      config.table = config.table || defaultColumnsByPrimaryKey(_.first(this.getPrimaryKeys(modelName)));

      return config;
    }
    logger.warn(TAG, `'${modelName}' not found in`, this.modelConfigs, 'generate a default one.');
    return { model: {}, table: defaultColumns, columns: {} };
  };

  getPrimaryKey = (modelName: string): string => _.head(this.getPrimaryKeys(modelName)) || 'id';

  getPrimaryKeys = (modelName: string): string[] => {
    const TAG = '[getPrimaryKey]';
    const { schemas } = AppContext.fromStore('models');
    const schema = R.prop(modelName)(schemas);
    if (schema != null) {
      const primaryKeys = _.filter(schema, opts => !!opts?.config?.primaryKey);
      // logger.debug(TAG, modelName, 'primaryKeys is', primaryKeys);
      if (primaryKeys.length) {
        return _.map(primaryKeys, fp.get('name'));
      }
    }
    return ['id']; // by default
  };

  getFormSchema = (name: string, values?: { [member: string]: any }): Asuna.Schema.FormSchemas => {
    const { schemas } = AppContext.fromStore('models');
    if (!schemas || !name) {
      logger.error('[getFormSchema]', 'schemas or name is required.', { schemas, name });
      return {};
    }
    const schema = R.prop(name)(schemas);
    logger.log('[getFormSchema]', name, schemas, schema);

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
          const length = _.toNumber(field?.config?.length) || null; // 0 || null is null
          const isNullable = field?.config?.nullable ?? true;
          const isRequired = field?.config?.info?.required ?? false;
          return {
            name: ref || field.name,
            ref,
            type: this.identifyType(name, field),
            options: {
              length,
              label: field?.config?.info?.name ?? null,
              selectable: field?.config?.selectable ?? null,
              required: !isNullable || isRequired,
              ...field?.config?.info,
              ...this.getModelConfig(name)?.model?.settings?.[field.name],
            },
            // 不存在时返回 undefined，而不能返回 null
            // null 会被当作值在更新时被传递
            value: values ? R.prop(field.name)(values) : undefined,
          };
        },
      ),
    )(schema) as { [member: string]: Asuna.Schema.FormSchema };
  };

  getAssociationByName = (associationName: string, modelName?: string): Required<Asuna.Schema.Association> => {
    const primaryKey = AppContext.adapters.models.getPrimaryKey(associationName);
    const defaultValue = { name: 'name', value: primaryKey, fields: [primaryKey, 'name'] };
    const defaultAssociation = R.pathOr(defaultValue, [associationName])(this.associations);
    return modelName
      ? this.modelConfigs?.[modelName]?.model?.associations?.[associationName] ?? defaultAssociation
      : defaultAssociation;
  };

  /**
   * @see loadModels2
   */
  loadModels = (modelName: string, configs: ModelListConfig = {}): Promise<AxiosResponse> => {
    logger.debug('[loadModels]', { modelName, configs, modelConfig: this.getModelConfig(modelName) });
    const page = configs?.pagination?.current ?? 1;
    const size = configs?.pagination?.pageSize ?? (Config.get('DEFAULT_PAGE_SIZE') as number);
    const auth = AppContext.fromStore('auth');
    return this.service.loadModels(auth, modelName, {
      pagination: { page, size },
      fields: configs?.fields,
      filters: _.mapValues<Record<string, [Condition]>, WhereConditions>(
        configs?.filters,
        _.flow(filter => (_.isArray(filter) ? filter[0] : filter), parseJSONIfCould),
      ),
      sorter: configs?.sorter,
      relations: configs?.relations,
      ...this.getModelConfig(modelName),
    });
  };

  loadModels2 = <T>(modelName: string, configs: ModelListConfig = {}): Promise<Asuna.PageableResponse<T>> => {
    logger.debug('[loadModels2]', { modelName, configs, modelConfig: this.getModelConfig(modelName) });
    const page = configs?.pagination?.current ?? 1;
    const size = configs?.pagination?.pageSize ?? (Config.get('DEFAULT_PAGE_SIZE') as number);
    const auth = AppContext.fromStore('auth');
    return this.service
      .loadModels(auth, modelName, {
        pagination: { page, size },
        fields: configs?.fields,
        filters: _.mapValues<Record<string, [Condition]>, WhereConditions>(
          configs?.filters,
          _.flow(filter => (_.isArray(filter) ? filter[0] : filter), parseJSONIfCould),
        ),
        sorter: configs?.sorter,
        relations: configs?.relations,
        ...this.getModelConfig(modelName),
      })
      .then(fp.get('data'));
  };

  loadAssociationByIds = (associationName: string, ids: string[] | number[]): Promise<AxiosResponse | void> => {
    if (_.trim(associationName) && !_.isEmpty(ids)) {
      logger.debug('[loadAssociationByIds]', { associationName, ids });

      const fields = this.getAssociationByName(associationName).fields;
      const auth = AppContext.fromStore('auth');
      return this.service.loadAssociationByIds(auth, associationName, {
        ids,
        fields,
        ...this.getModelConfig(associationName),
      });
    }
    return Promise.resolve();
  };

  loadAssociation = (
    associationName,
    configs: { keywords: string | null; page?: number } = { keywords: '' },
  ): Promise<AxiosResponse | AxiosResponse[] | void> => {
    if (!associationName) {
      logger.warn('[loadAssociation]', 'associationName is required.');
      return Promise.resolve();
    }

    const fields = this.getAssociationByName(associationName).fields;
    logger.debug('[loadAssociation]', { fields, associationName, associations: this.associations });
    const auth = AppContext.fromStore('auth');
    return this.service.loadAssociation(auth, associationName, {
      ...configs,
      fields,
      ...this.getModelConfig(associationName),
    });
  };

  /**
   * @deprecated {@see loadOriginSchema}
   * @param modelName
   */
  loadSchema = async (modelName: string) => {
    return CacheHelper.cacheable(`loadSchema#${modelName}`, () => {
      const auth = AppContext.fromStore('auth');
      return this.service.loadSchema(auth, modelName, this.getModelConfig(modelName));
    });
  };

  loadOriginSchema = async (modelName: string): Promise<Asuna.Schema.OriginSchema> => {
    return CacheHelper.cacheable(`loadOriginSchema#${modelName}`, () => {
      const auth = AppContext.fromStore('auth');
      return this.service.loadOriginSchema(auth, modelName, this.getModelConfig(modelName)).then(fp.get('data'));
    });
  };

  async loadOriginSchemas(): Promise<{ [name: string]: Asuna.Schema.OriginSchema }> {
    if (AppContext.ctx.graphql.serverClient) {
      const allResponse = await AppContext.ctx.graphql.loadSchemas();
      return Object.assign({}, ..._.map(allResponse, ({ name, schema }) => ({ [name]: schema })));
    } else {
      const callable = { ...this.allModels.map(modelName => ({ [modelName]: this.loadOriginSchema(modelName) })) };
      const allResponse = await Promise.props(callable);
      return Object.assign({}, ..._.map(allResponse, (response, name) => ({ [name]: (response as any).data })));
    }
  }

  async loadSchemas() {
    if (AppContext.ctx.graphql.serverClient) {
      const allResponse = await AppContext.ctx.graphql.loadSchemas();
      return Object.assign({}, ..._.map(allResponse, ({ name, schema }) => ({ [name]: schema })));
    } else {
      const callable = { ...this.allModels.map(modelName => ({ [modelName]: this.loadSchema(modelName) })) };
      const allResponse = await Promise.props(callable);
      return Object.assign({}, ..._.map(allResponse, (response, name) => ({ [name]: (response as any).data })));
    }
  }
}

export const modelProxyCaller: () => ModelAdapter = () => AppContext.ctx.models;
