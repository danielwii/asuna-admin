import * as R from 'ramda';
import * as _ from 'lodash';
import { AxiosResponse } from 'axios';
import idx from 'idx';

import { TablePagination } from './response';

import { DynamicFormTypes } from '@asuna-admin/components';
import { defaultColumns } from '@asuna-admin/helpers';
import { AppContext, AsunaDefinitions } from '@asuna-admin/core';
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
    configs: {
      relations?: string[];
      pagination?: Asuna.Pageable;
      filters?: any;
      sorter?: any;
    } & Asuna.Schema.ModelConfig,
  ): Promise<AxiosResponse>;

  loadSchema(auth: { token: string | null }, modelName: string, data): Promise<AxiosResponse>;

  fetch(
    auth: { token: string | null },
    modelName: string,
    data: { endpoint?: string; id: number; profile?: Asuna.Profile } & Asuna.Schema.ModelConfig,
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

const logger = createLogger('adapters:models');

export interface ModelListConfig {
  endpoint?: string;
  pagination?: TablePagination;
  filters?;
  sorter?: Sorter | null;
  relations?: string[];
}

export class ModelAdapter {
  private service: IModelService;
  private allModels: string[];
  private modelConfigs;
  private associations;

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

    logger.log('[ModelAdapter]', '[constructor]', this.modelConfigs);
    _.map(this.modelConfigs, (config, name) => {
      logger.debug('[ModelAdapter][constructor]', 'check', name, config);
      if (!config.table) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set table');
      if (!config.model) logger.debug('[ModelAdapter]', '[constructor]', name, 'should set model');
    });
  }

  public identifyType = (field: Asuna.Schema.ModelSchema) => {
    if (['id', 'created_at', 'updated_at'].indexOf(field.name) > -1) {
      return DynamicFormTypes.Plain;
    }

    // --------------------------------------------------------------
    // identify advanced types
    // --------------------------------------------------------------

    // has foreign keys
    if (idx(field, _ => _.config.selectable)) {
      return idx(field, _ => _.config.many)
        ? DynamicFormTypes.ManyToMany
        : DynamicFormTypes.Association;
    }

    const advancedType = idx(field, _ => _.config.info.type);

    if (advancedType === 'RichText') return DynamicFormTypes.RichText;
    if (advancedType === 'Image') return DynamicFormTypes.Image;
    if (advancedType === 'Images') return DynamicFormTypes.Images;
    if (advancedType === 'Video') return DynamicFormTypes.Video;
    if (advancedType === 'Authorities') return DynamicFormTypes.Authorities;
    if (advancedType === 'Enum') return DynamicFormTypes.Enum;
    if (advancedType === 'EnumFilter') return DynamicFormTypes.EnumFilter;

    // --------------------------------------------------------------
    // identify basic types
    // --------------------------------------------------------------

    const type = idx(field, _ => _.config.type);

    if (type) {
      if (/^(VARCHAR.*|String)$/i.test(type)) return DynamicFormTypes.Input;
      if (/^(INTEGER|FLOAT|Number)$/i.test(type)) return DynamicFormTypes.InputNumber;
      if (/^TEXT$/i.test(type)) return DynamicFormTypes.TextArea;
      if (/^DATETIME$/i.test(type)) return DynamicFormTypes.DateTime;
      if (/^DATE$/i.test(type)) return DynamicFormTypes.Date;
      if (/^BOOLEAN$/i.test(type)) return DynamicFormTypes.Switch;
    }

    logger.warn('[identifyType]', 'type', type, 'cannot identified.');
    return type || null;
  };

  public fetch = (
    modelName: string,
    data: { endpoint?: string; id: number; profile?: Asuna.Profile },
  ) => {
    const auth = AppContext.fromStore('auth');
    return this.service.fetch(auth, modelName, {
      ...data,
      ...this.getModelConfig(modelName),
    });
  };

  public remove = (modelName: string, data) => {
    const auth = AppContext.fromStore('auth');
    return this.service.remove(auth, modelName, {
      ...data,
      ...this.getModelConfig(modelName),
    });
  };

  public upsert = (modelName: string, data: { body: IModelBody }): Promise<AxiosResponse> => {
    const auth = AppContext.fromStore('auth');
    const { schemas } = AppContext.fromStore('models');
    logger.debug('[upsert]', 'upsert', { modelName, data });

    const allSchemas = schemas || AppContext.store.select(R.path(['models', 'schemas']));

    const fields = this.getFormSchema(allSchemas, modelName);
    logger.debug('[upsert]', 'fields is', fields);

    const fixKeys = _.mapKeys(data.body, (value, key) => idx(fields, _ => _[key].ref) || key);
    const transformed = _.mapValues(fixKeys, (value, key) => {
      // json 用于描述该字段需要通过字符串转换处理，目前用于服务器端不支持 JSON 数据格式的情况
      return _.eq(idx(fields, _ => _[key].options.json), 'str') ? JSON.stringify(value) : value;
    });
    logger.debug('[upsert]', 'transformed is', transformed);

    const id = idx(data, _ => _.body.id);
    if (id) {
      return this.service.update(auth, modelName, {
        id,
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

  public getAssociationConfigs = (modelName: string) => R.prop(modelName)(this.associations);

  public getModelConfig = (modelName: string): Asuna.Schema.ModelConfig => {
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

  public getFormSchema = (
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
          const length = _.toNumber(idx(field, _ => _.config.length)) || null; // 0 || null is null
          const isNullable = _.defaultTo(idx(field, _ => _.config.nullable), true);
          const isRequired = _.defaultTo(idx(field, _ => _.config.info.required), false);
          return {
            name: ref || field.name,
            ref,
            type: this.identifyType(field),
            options: {
              length,
              label: _.defaultTo(idx(field, _ => _.config.info.name), null),
              // foreignKeys: idx(field, _ => _..config.foreignKeys), // @deprecated
              selectable: _.defaultTo(idx(field, _ => _.config.selectable), null),
              required: !isNullable || isRequired,
              ...idx(field, _ => _.config.info),
              ...idx(this.getModelConfig(name), _ => _.model.settings[field.name]),
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
    const page = _.defaultTo(idx(configs, _ => _.pagination.current), 1);
    const size = _.defaultTo(
      idx(configs, _ => _.pagination.pageSize),
      Config.get('DEFAULT_PAGE_SIZE') || 25,
    );
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
  ): Promise<AxiosResponse | void> => {
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
    return Promise.resolve();
  };

  public loadAssociation = (
    associationName,
    configs: { keywords: string | null; page?: number } = { keywords: '' },
  ): Promise<AxiosResponse | AxiosResponse[] | void> => {
    if (!associationName) {
      logger.warn('[loadAssociation]', 'associationName is required.');
      return Promise.resolve();
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

  public loadSchema = (modelName: string) => {
    const auth = AppContext.fromStore('auth');
    return this.service.loadSchema(auth, modelName, this.getModelConfig(modelName));
  };

  public listAssociationsCallable = (associationNames: string[]) =>
    Object.assign({}, ...associationNames.map(name => ({ [name]: this.loadAssociation(name) })));

  public listSchemasCallable = () =>
    Object.assign(
      {},
      ...this.allModels.map(modelName => ({ [modelName]: this.loadSchema(modelName) })),
    );
}
