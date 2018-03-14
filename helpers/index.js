// @flow weak
// export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });
import moment   from 'moment/moment';
import * as R   from 'ramda';
import deepDiff from 'deep-diff';

import { DynamicFormTypes } from '../components/DynamicForm';
import { modelsProxy }      from '../adapters/models';
import { createLogger }     from '../adapters/logger';

const logger = createLogger('helpers');

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

export const diff = (first, second) => {
  const verbose = deepDiff(first, second);
  return { verbose, isDifferent: !!verbose };
};

export const schemaHelper = {
  /**
   * 自动通过公共 associations 填充未定义的关联
   * @param fields
   * @returns {*}
   */
  associationDecorator: (fields) => {
    logger.info('[schemaHelper][associationDecorator]', { fields });

    const associationFields = R.filter(R.compose(R.not, R.isNil, R.prop('associations')))(fields);
    if (R.not(R.isEmpty(associationFields))) {
      logger.info('[schemaHelper][associationDecorator]', { associationFields });
      const wrapForeignOpt = R.map(opt => ({
        ...opt, association: modelsProxy.getAssociationConfigs(opt.modelName),
      }));
      const withAssociations  = R.mapObjIndexed(field => ({
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
  enumDecorator: (fields) => {
    logger.info('[schemaHelper][enumDecorator]', { fields });

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
