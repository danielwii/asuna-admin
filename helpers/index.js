// export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });
import moment   from 'moment/moment';
import * as R   from 'ramda';
import deepDiff from 'deep-diff';

import { DynamicFormTypes }    from '../components/DynamicForm';
import { modelsProxy }         from '../adapters/models';
import { storeConnectorProxy } from '../adapters/storeConnector';
import { createLogger }        from '../adapters/logger';

const logger = createLogger('helpers', 3);

// TODO make helpers configurable
export const authHeader = token => ({ headers: { Authorization: token } });

export const actionHelper = {};

export const columnHelper = {
  generate        : (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : text => (render ? render(text) : text),
  }),
  generateCalendar: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : text => (render ? render(text) : moment(text).calendar()),
  }),
  /**
   * 生成动作按钮
   * @param actions 最终的渲染函数
   * @param extras 需要接受 auth 参数传入
   * @returns {{key: string, title: string, render: function(*=, *=): *}}
   */
  generateActions : (actions, extras) => ({
    key   : 'action',
    title : 'Action',
    render: (text, record) =>
      actions(text, record, extras ? auth => extras(text, record, auth) : null),
  }),
};

/**
 * 通用配置
 */
export const commonColumns = {
  any       : any => columnHelper.generate(any, any.toUpperCase()),
  id        : columnHelper.generate('id', 'ID'),
  name      : columnHelper.generate('name', '名称'),
  title     : columnHelper.generate('title', '标题'),
  name_en   : columnHelper.generate('name_en', '英文名称'),
  email     : columnHelper.generate('email', 'Email'),
  createdAt : columnHelper.generateCalendar('createdAt', '创建时间'),
  created_at: columnHelper.generateCalendar('created_at', '创建时间'),
  updatedAt : columnHelper.generateCalendar('updatedAt', '更新时间'),
  updated_at: columnHelper.generateCalendar('updated_at', '更新时间'),
  actions   : columnHelper.generateActions,
};

export const defaultColumns = actions => [
  commonColumns.id,
  // commonColumns.createdAt,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const defaultNameColumns = actions => [
  commonColumns.id,
  commonColumns.name,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const defaultTitleColumns = actions => [
  commonColumns.id,
  commonColumns.title,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const diff = (first, second, { include, exclude } = {}) => {
  let verbose;
  if (R.not(R.anyPass([R.isEmpty, R.isNil])(include))) {
    verbose = deepDiff(R.pickAll(include)(first), R.pickAll(include)(second));
  } else if (R.not(R.anyPass([R.isEmpty, R.isNil])(exclude))) {
    verbose = deepDiff(R.omit(include)(first), R.omit(include)(second));
  } else {
    verbose = deepDiff(first, second);
  }
  return { verbose, isDifferent: !!verbose };
};

export const schemaHelper = {
  peek: callback => async (fields) => {
    callback();
    logger.log('[schemaHelper][peek]', { fields });
    return fields;
  },

  /**
   * 异步加载所有的关联对象，用于下拉菜单提示
   * @param fields
   * @returns {Promise<*>}
   */
  loadAssociationsDecorator: async (fields) => {
    logger.log('[schemaHelper][loadAssociationsDecorator]', { fields });

    const relationShips = [DynamicFormTypes.Association, DynamicFormTypes.ManyToMany];
    const associations  = R.filter(field => R.contains(field.type)(relationShips))(fields);

    if (R.not(R.isEmpty(associations))) {
      logger.info('[schemaHelper][loadAssociationsDecorator]', 'associations is', associations);
      const auth = storeConnectorProxy.getState('auth');

      const wrappedAssociations = await Promise.all(R.values(associations).map(async (field) => {
        const foreignKeys = R.pathOr([], ['options', 'foreignKeys'])(field);
        logger.info('[schemaHelper][loadAssociationsDecorator]', 'handle field', field, foreignKeys);
        if (foreignKeys && foreignKeys.length > 0) {
          const fieldsOfAssociations = modelsProxy.getFieldsOfAssociations();

          const foreignOpts = R.map((foreignKey) => {
            const regex = foreignKey.startsWith('t_')
              ? /t_(\w+)\.(\w+)/  // t_model.id -> model
              : /(\w+)\.(\w+)/;   // model.id   -> model

            // update model_name to model-name
            const [, modelName, property] = foreignKey.match(regex);

            const association = fieldsOfAssociations[modelName];
            return { modelName, property, association };
          })(foreignKeys);
          logger.info('[schemaHelper][loadAssociationsDecorator]', 'foreignOpts is', foreignOpts);

          const associationNames = R.pluck('modelName')(foreignOpts);
          logger.info('[schemaHelper][loadAssociationsDecorator]', 'associationNames is', associationNames);

          const effects = modelsProxy.listAssociationsCallable(auth, associationNames);
          logger.info('[schemaHelper][loadAssociationsDecorator]', 'list associations callable', effects);

          let allResponse = {};
          try {
            allResponse = await Promise.all(R.values(effects));
            logger.info('[schemaHelper][loadAssociationsDecorator]', 'allResponse is', allResponse);
          } catch (e) {
            logger.error('[schemaHelper][loadAssociationsDecorator]', e);
          }

          const foreignKeysResponse = R.zipObj(associationNames, R.map(R.prop('data'), allResponse));
          logger.info('[schemaHelper][loadAssociationsDecorator]', 'foreignOpts is', foreignOpts, 'foreignKeysResponse is', foreignKeysResponse);

          return { ...field, foreignOpts, associations: foreignKeysResponse };
        }
        logger.warn('[schemaHelper][loadAssociationsDecorator]', 'no foreignKeys with association', field);
        return { ...field, type: DynamicFormTypes.Input };
      }));

      const pairedWrappedAssociations = R.zipObj(R.keys(associations), wrappedAssociations);
      logger.info('[schemaHelper][loadAssociationsDecorator]', 'wrapped associations', pairedWrappedAssociations);

      return R.mergeDeepRight(fields, pairedWrappedAssociations);
    }

    return fields;
  },

  /**
   * 自动通过公共 associations 填充未定义的关联
   * @param fields
   * @returns {*}
   */
  associationDecorator: async (fields) => {
    logger.log('[schemaHelper][associationDecorator]', { fields });

    const associationFields = R.filter(R.compose(R.not, R.isNil, R.prop('associations')))(fields);
    if (R.not(R.isEmpty(associationFields))) {
      logger.info('[schemaHelper][associationDecorator]', { associationFields });
      const wrapForeignOpt   = R.map(opt => ({
        ...opt, association: modelsProxy.getAssociationConfigs(opt.modelName),
      }));
      const withAssociations = R.mapObjIndexed(field => ({
        ...field, foreignOpts: wrapForeignOpt(field.foreignOpts),
      }))(associationFields);
      logger.info('[schemaHelper][associationDecorator]', { withAssociations });

      const wrappedFields = R.mergeDeepRight(fields, withAssociations);
      logger.info('[schemaHelper][associationDecorator]', { wrappedFields });

      return wrappedFields;
    }

    return fields;
  },

  /**
   * 通过 Enum 定义中的 enum_data 的 key 值拉取相应 schema 中的关联
   * 通过所有的被选关联字段的 schema name 和 key 比较
   * 目前认为每个 model schema 只有一个 enum filter 定义
   * @param fields
   * @returns {*}
   */
  enumDecorator: async (fields) => {
    logger.log('[schemaHelper][enumDecorator]', { fields });

    const enumFilterFields = R.filter(R.propEq('type', DynamicFormTypes.EnumFilter))(fields);
    if (R.not(R.isEmpty(enumFilterFields))) {
      const [, enumFilterField] = R.toPairs(enumFilterFields)[0];
      // console.log(enumFilterField);
      logger.info('[schemaHelper][enumDecorator]', { enumFilterField });

      const enums   = R.compose(
        R.map(R.prop('key')),
        R.path(['options', 'enum_data']),
      )(enumFilterField);
      const current = R.pathOr('', ['value'])(enumFilterField);
      logger.info('[schemaHelper][enumDecorator]', { enums, current });

      // save positions value
      const positionsField = R.compose(
        R.map(field => ({ ...field, value: R.path([current, 'value'])(fields) })),
        R.filter(R.pathEq(['options', 'type'], 'SortPosition')),
      )(fields);

      const filteredNames  = R.without(current)(enums);
      const filteredFields = R.omit(filteredNames)(fields);
      const wrappedFields  = current
        ? R.mergeDeepRight(filteredFields,
          {
            [current]: {
              isFilterField: true,
              options      : { filter_type: R.path(['options', 'filter_type'])(enumFilterField) },
            },
            ...positionsField,
          })
        : filteredFields;
      logger.info(
        '[schemaHelper][enumDecorator]',
        {
          filteredNames, filteredFields, wrappedFields, positionsField,
        },
      );

      return wrappedFields;
    }

    return fields;
  },
};
