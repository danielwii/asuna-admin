import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';
import { ApiResponse } from '@danielwii/asuna-shared';

import { message } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import NodeCache, { NodeCacheLegacyCallbacks } from 'node-cache';
import * as R from 'ramda';

import { GraphqlAdapterImpl } from '../adapters/graphql';
import { DynamicFormTypes } from '../components/DynamicForm/types';
import { Config } from '../config';
import { Store } from '../core/store';
import { castModelKey } from '../helpers/cast';
import { defaultColumns, defaultColumnsByPrimaryKey } from '../helpers/columns/common';
import { TenantContext } from '../helpers/tenant-context';
import { BatchLoader } from '../helpers/utils';
import { createLogger } from '../logger';

import type { Condition, WhereConditions } from '@danielwii/asuna-shared';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import type { AxiosResponse } from 'axios';
import type { AsunaDefinitions } from '../core/definitions';
import type { RelationColumnProps } from '../helpers/columns/types';
import type { Asuna } from '../types';

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
  loadModels: (
    modelName: string,
    configs: {
      relations?: string[];
      fields?: string[];
      pagination?: Asuna.Pageable;
      filters?: WhereConditions;
      sorter?: any;
    } & Asuna.Schema.ModelConfig,
  ) => Promise<AxiosResponse>;

  /**
   * @deprecated {@see loadOriginSchema}
   * @param auth
   * @param modelName
   * @param data
   */
  loadSchema: (modelName: string, data) => Promise<AxiosResponse>;

  loadOriginSchema: (modelName: string, data) => Promise<AxiosResponse>;

  fetch: (
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
  ) => Promise<AxiosResponse>;

  remove: (modelName: string, data: { endpoint?: string; id: number }) => Promise<AxiosResponse>;

  viewProtectedField: (
    modelName: string,
    data: { endpoint?: string; id: number | string; field: string },
  ) => Promise<AxiosResponse>;

  insert: (
    modelName: string,
    data: { endpoint?: string; body: IModelBody } & Asuna.Schema.ModelConfig,
  ) => Promise<AxiosResponse>;

  update: (
    modelName: any,
    data: {
      endpoint?: string;
      id: number | string;
      // 主键的名称可能不是 id，这里的 id 代表值，primaryKey 代编键的名称
      primaryKey?: string;
      body: IModelBody;
    } & Asuna.Schema.ModelConfig,
  ) => Promise<AxiosResponse>;

  loadAssociation: (
    associationName: string,
    data: Asuna.Schema.ModelConfig & RestListQuery,
  ) => Promise<AxiosResponse | AxiosResponse[]>;

  loadAssociationByIds: (
    associationName: string,
    data: Asuna.Schema.ModelConfig & { fields: string[]; ids: string[] | number[] },
  ) => Promise<AxiosResponse>;

  uniq: (
    { modelConfig }: { modelConfig: Asuna.Schema.ModelConfig },
    modelName: string,
    data: { column: string },
  ) => Promise<AxiosResponse>;

  groupCounts: (
    { modelConfig }: { modelConfig: Asuna.Schema.ModelConfig },
    modelName: string,
    data: { column: string; where: string },
  ) => Promise<AxiosResponse<{ [id: string]: { [name: string]: number } }>>;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

// const logger = createLogger('adapters:models');
const logger = createLogger('adapters:models');

export interface ModelListConfig {
  endpoint?: string;
  fields?: string[];
  // distinct?: boolean;
  pagination?: TablePaginationConfig;
  filters?: Record<string, [Condition]>;
  sorter?: Sorter | null;
  relations?: string[];
}

export interface ModelAdapter {
  batchFetch: <T>(modelName: string, data: { id: string | number; relations?: string[] }) => Promise<T>;
  fetch2: <T>(
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
  ) => Promise<T>;
  getPrimaryKey: (modelName: string) => string;
  loadModels2: <T>(modelName: string, configs?: ModelListConfig) => Promise<Asuna.PageableResponse<T>>;
  uniq: (modelName: string, column: string, where?: object) => Promise<string[]>;
  groupCounts: (modelName: string, column: string, relation: string, id: string) => Promise<{ [name: string]: number }>;
  loadOriginSchema: (modelName: string) => Promise<Asuna.Schema.OriginSchema>;
  getColumns: (
    modelName: string,
    opts: { callRefresh: () => void; actions: (text, record, extras) => any; ctx: Asuna.Schema.TableContext },
    extraName?: string,
  ) => Promise<RelationColumnProps[]>;
}

export class ModelAdapterImpl implements ModelAdapter {
  private readonly cache: NodeCacheLegacyCallbacks = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  private service: IModelService;
  private graphql: GraphqlAdapterImpl;
  private allModels: string[];
  readonly modelConfigs: { [K: string]: Asuna.Schema.ModelConfig };
  readonly associations: { [key: string]: Asuna.Schema.Association };
  readonly columnOpts: { [key: string]: Asuna.Schema.ColumnOpts<any> };
  /**
   * @param service
   * @param definitions - models: 模型定义; tableColumns: 模型列表定义; modelColumns: 模型表单定义
   *                      模型定义中出现的的元素才会作为最终元素
   */
  constructor(service: IModelService, definitions: AsunaDefinitions, graphql) {
    logger.log('[ModelAdapter][constructor]', { service, definitions });
    if (!service) {
      throw new Error('service must defined');
    }

    this.service = service;
    this.graphql = graphql;
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
    const notFound = (): string | undefined => {
      const info = { plainKeys, basicType, advanceType };
      logger.warn('[identifyType]', 'type cannot identified.', field, info);
      return basicType || advanceType;
    };
    return _.cond<Asuna.Schema.ModelSchema, DynamicFormTypes | undefined>([
      // --------------------------------------------------------------
      // plain types
      // --------------------------------------------------------------
      [_.conforms({ name: R.includes<any[]>(R.__, plainKeys) }), _.constant(DynamicFormTypes.Plain)],
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
          _.cond<typeof advanceType, any>([
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
          _.cond<typeof basicType, any>([
            [() => /^(VARCHAR.*|String)$/i.test(basicType), () => DynamicFormTypes.Input],
            [
              () => /^(int|int4|INTEGER|FLOAT|Number|Numeric|Decimal|Double.*)$/i.test(basicType),
              () => DynamicFormTypes.InputNumber,
            ],
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
    const auth = Store.fromStore();
    const modelConfig = this.getModelConfig(modelName);
    return this.service.uniq({ modelConfig }, modelName, { column }).then(fp.get('data'));
  }

  _groupCountsBatchLoader = new BatchLoader<{ modelName; column; relation; id: string }, any>(
    (keys) => {
      const { modelName, column, relation } = keys[0];
      const auth = Store.fromStore();
      const modelConfig = this.getModelConfig(modelName);
      const ids = _.map(keys, fp.get('id'));
      const where = JSON.stringify({ [relation]: { $in: ids } });
      return this.service.groupCounts({ modelConfig }, modelName, { column, where }).then(fp.get('data'));
    },
    { extractor: (data, key) => _.get(data, key?.id) },
  );
  groupCounts = async (
    modelName: string,
    column: string,
    relation: string,
    id: string,
  ): Promise<{ [name: string]: number }> =>
    this._groupCountsBatchLoader.load({ modelName, column, relation, id }).catch(console.error);

  _fetchBatchLoader = new BatchLoader<{ modelName: string; data: { id: string | number; relations?: string[] } }, any>(
    (keys) => {
      const { modelName, data } = keys[0];
      const ids = _.map(keys, fp.get('data.id'));
      return this.loadModels2(modelName, { filters: { id: [{ $in: ids }] }, relations: data.relations });
    },
    { extractor: (data, key) => _.find(data.items, ({ id }) => id === key?.data?.id) },
  );

  batchFetch = (modelName: string, data: { id: string | number; relations?: string[] }) =>
    this._fetchBatchLoader.load({ modelName, data }).catch(console.error);

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

    // const auth = Store.fromStore();
    const modelConfig = this.getModelConfig(modelName);
    const schema = this.getFormSchema(modelName);
    const selectableRelations = _.chain(schema)
      .pickBy(fp.get('options.selectable'))
      // .pickBy(_.flow([fp.get('options.accessible'), fp.negate(fp.eq('hidden'))]))
      .pickBy((opts) => !_.includes(_.get(opts, 'options.accessible'), 'hidden'))
      .keys()
      .value();
    const relations = _.flow(_.flattenDeep, _.uniq, fp.join(','))([selectableRelations, data.relations ?? []]);
    logger.log({ schema, selectableRelations, data, relations });
    return this.service.fetch(modelName, Object.assign(data, modelConfig, { relations }));
  };

  remove = (modelName: string, data) => {
    // const auth = Store.fromStore();
    return this.service.remove(modelName, {
      ...data,
      ...this.getModelConfig(modelName),
    });
  };

  upsert = (modelName: string, data: { body: IModelBody }): Promise<AxiosResponse> => {
    // const auth = Store.fromStore();
    // const { schemas } = Store.fromStore('models');
    logger.debug('[upsert]', 'upsert', { modelName, data });

    // const allSchemas = schemas || AppContext.store.select(R.path(['models', 'schemas']));

    const fields = this.getFormSchema(modelName);
    const primaryKey = this.getPrimaryKey(modelName);
    logger.debug('[upsert]', 'fields is', fields);

    const id: any = _.get(data?.body, 'id') ?? _.get(data?.body, primaryKey); // data?.body?.[primaryKey] as any;
    const removedPrimaryKey = _.omit(data?.body, 'id') as any; // data?.body?.[primaryKey] as any;
    const fixKeys = _.mapKeys(removedPrimaryKey, (value, key) => fields?.[key]?.ref || key);
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      return _.eq(fields?.[key]?.options?.json, 'str') ? JSON.stringify(value) : value;
    });
    const convertNullTransformed = _.mapValues(transformed, (v) => (_.isNil(v) ? null : v));
    logger.debug('[upsert]', 'transformed is', convertNullTransformed);

    if (id) {
      return this.service.update(modelName, {
        id,
        primaryKey,
        ...data,
        body: convertNullTransformed,
        ...this.getModelConfig(modelName),
      });
    }
    return this.service.insert(modelName, {
      ...data,
      body: convertNullTransformed,
      ...this.getModelConfig(modelName),
    });
  };

  getAssociationConfigs = (modelName: string) => R.prop(modelName)(this.associations);

  getColumns = async (
    modelName: string,
    opts: { callRefresh: () => void; actions: (text, record, extras) => any; ctx: Asuna.Schema.TableContext },
    extraName?: string,
  ): Promise<RelationColumnProps[]> => {
    logger.log('[getColumns]', { modelName, extraName, opts });
    const formSchema = this.getFormSchema(modelName);
    const { table: columnsRender } = this.getModelConfig(extraName ?? modelName);
    const readonly = !TenantContext.enableModelPublishForCurrentUser(modelName);
    const columns = columnsRender
      ? await Promise.all(
          columnsRender(opts.actions, { modelName, callRefresh: opts.callRefresh, readonly, ctx: opts.ctx }),
        )
      : [];

    return _.map(columns, (column: RelationColumnProps) => {
      // 不检测不包含在 schema 中且不属于模型的列名
      const isRelationKey = _.includes(column.key as string, '.');
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

  getPrimaryKey = _.memoize((modelName: string): string => _.head(this.getPrimaryKeys(modelName)) || 'id');

  getPrimaryKeys = _.memoize((modelName: string): string[] => {
    const TAG = '[getPrimaryKeys]';
    const { schemas } = Store.fromStore();
    const schema: Asuna.Schema.ModelSchema[] = R.prop(modelName)(schemas as any);
    if (schema !== null) {
      const primaryKeys = _.filter(schema, (opts) => !!opts?.config?.primaryKey);
      logger.info(TAG, modelName, 'primaryKeys is', primaryKeys, schema);
      if (primaryKeys.length) {
        return _.map(primaryKeys as any[], fp.get('name'));
      }
    }
    return ['id']; // by default
  });

  getFormSchema = _.memoize((name: string, values?: { [member: string]: any }): Asuna.Schema.FormSchemas => {
    const { schemas } = Store.fromStore();
    if (!schemas || !name) {
      logger.error('[getFormSchema]', 'schemas or name is required.', { schemas, name });
      return {};
    }
    const schema = R.prop(name)(schemas);
    logger.debug('[getFormSchema]', name, schema);

    if (!schema) {
      logger.error('[getFormSchema]', 'schema is required.', { schemas, name });
      return {};
    }

    logger.debug('[getFormSchema]', 'schema is', schema, 'name is', name);
    return R.compose(
      R.mergeAll as any,
      R.map((formatted: Asuna.Schema.FormSchema) => ({ [formatted.name]: formatted })),
      R.map((field: Asuna.Schema.ModelSchema): Asuna.Schema.FormSchema => {
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
            relation: field?.config?.relation,
            required: !isNullable || isRequired,
            ...field?.config?.info,
            ...this.getModelConfig(name)?.model?.settings?.[field.name],
          },
          // 不存在时返回 undefined，而不能返回 null
          // null 会被当作值在更新时被传递
          value: values ? R.prop(field.name)(values) : undefined,
        };
      }),
    )(schema) as { [member: string]: Asuna.Schema.FormSchema };
  });

  getAssociationByName = (associationName: string, modelName?: string): Required<Asuna.Schema.Association> => {
    const primaryKey = this.getPrimaryKey(associationName);
    const defaultValue = { name: 'name', value: primaryKey, fields: [primaryKey, 'name'] };
    const defaultAssociation = R.pathOr(defaultValue, [associationName])(this.associations);
    return modelName
      ? this.modelConfigs?.[modelName]?.model?.associations?.[associationName] ?? (defaultAssociation as any)
      : defaultAssociation;
  };

  /**
   * @see loadModels2
   */
  loadModels = (modelName: string, configs: ModelListConfig = {}): Promise<AxiosResponse> => {
    logger.info('[loadModels]', { modelName, configs, modelConfig: this.getModelConfig(modelName) });
    const page = configs?.pagination?.current ?? 1;
    const size = configs?.pagination?.pageSize ?? (Config.get('DEFAULT_PAGE_SIZE') as number);
    return this.service.loadModels(modelName, {
      pagination: { page, size },
      fields: configs?.fields,
      filters: _.mapValues<Record<string, [Condition]>, WhereConditions>(
        configs?.filters,
        _.flow((filter) => {
          if (_.isArray(filter)) {
            return _.isObject(filter[0]) ? filter[0] : { $in: filter };
          } else {
            return filter;
          }
        }, parseJSONIfCould),
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
    return this.service
      .loadModels(modelName, {
        pagination: { page, size },
        fields: configs?.fields,
        filters: _.mapValues<Record<string, [Condition]>, WhereConditions>(
          configs?.filters,
          _.flow((filter) => (_.isArray(filter) ? filter[0] : filter), parseJSONIfCould),
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
      return this.service.loadAssociationByIds(associationName, {
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
    return this.service.loadAssociation(associationName, {
      ...configs,
      fields,
      ...this.getModelConfig(associationName),
    });
  };

  /**
   * @deprecated {@see loadOriginSchema}
   * @param modelName
   */
  loadSchema = _.memoize((modelName: string) => this.service.loadSchema(modelName, this.getModelConfig(modelName)));

  loadOriginSchema = _.memoize(
    (modelName: string): Promise<Asuna.Schema.OriginSchema> =>
      this.service.loadOriginSchema(modelName, this.getModelConfig(modelName)).then(fp.get('data')),
  );

  async loadOriginSchemas(): Promise<{ [name: string]: Asuna.Schema.OriginSchema }> {
    if (this.graphql.client) {
      const allResponse = await this.graphql.loadSchemas();
      return Object.assign({}, ..._.map(allResponse, ({ name, schema }) => ({ [name]: schema })));
    } else {
      const callable = { ...this.allModels.map((modelName) => ({ [modelName]: this.loadOriginSchema(modelName) })) };
      const allResponse = await Promise.props(callable);
      return Object.assign({}, ..._.map(allResponse, (response, name) => ({ [name]: (response as any).data })));
    }
  }

  async loadSchemas() {
    if (this.graphql.client) {
      const allResponse = await this.graphql.loadSchemas();
      return Object.assign({}, ..._.map(allResponse, ({ name, schema }) => ({ [name]: schema })));
    } else {
      const callable = { ...this.allModels.map((modelName) => ({ [modelName]: this.loadSchema(modelName) })) };
      const allResponse = await Promise.props(callable);
      return Object.assign({}, ..._.map(allResponse, (response, name) => ({ [name]: (response as any).data })));
    }
  }

  async loadProtectedField(
    modelName: string,
    id: string | number,
    field: string,
  ): Promise<ApiResponse<{ value: string }>> {
    return this.service.viewProtectedField(modelName, { id, field }).then(fp.get('data'));
  }
}
