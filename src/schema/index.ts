import _ from 'lodash';
import * as R from 'ramda';
import bluebird from 'bluebird';
import idx from 'idx';

import { DynamicFormTypes } from '@asuna-admin/components';
import { castModelKey, castModelName } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

const logger = createLogger('helpers:schema');

export const peek = (message, callback?) => fields => {
  if (callback) callback();
  logger.log('[peek]', { message, fields });
  return fields;
};

export const tables = {
  treeDecorator({ schema: index, items }) {
    const TAG = '[treeDecorator]';
    logger.log(TAG, { schema: index, items });
    const field = R.compose(
      R.find((field: Asuna.Schema.FormSchema) => field.options.type === 'Tree'),
      R.values,
    )(index);
    if (field) {
      logger.log(TAG, { field });
      // TODO need implemented.
    }
    return { schema: index, items };
  },
};

type Fields = {
  [key: string]: {
    name: string;
    ref: string;
    type: string;
    value?: any;
    options: {
      name: string;
      type: DynamicFormTypes;
      label: string | null;
      length: number | null;
      required: boolean;
      selectable?: string;
      jsonType?: string;
    };
  };
};

type WithHidden = {
  options: { hidden?: boolean };
};

type PositionsField = Fields &
  WithHidden &
  DeepPartial<{
    options: {
      accessible: 'readonly';
      json: 'str';
      type: 'SortPosition';
    };
  }>;

export const hiddenComponentDecorator = (fields: Fields): Fields & WithHidden => {
  const TAG = '[hiddenComponentDecorator]';
  logger.log(TAG, { fields });

  let wrappedFields = R.omit([castModelKey('createdAt'), castModelKey('updatedAt')])(fields);
  if (R.has('id', wrappedFields)) {
    const hidden = R.isNil(wrappedFields.id.value);
    wrappedFields = R.mergeDeepRight(wrappedFields, { id: { options: { hidden } } });
  }

  const positions = R.filter(R.pathEq(['options', 'type'], 'SortPosition'))(wrappedFields);
  if (!R.isEmpty(positions)) {
    const hiddenPositions = R.map(position => ({
      ...position,
      options: { hidden: true },
    }))(positions);

    wrappedFields = R.mergeDeepRight(wrappedFields, { ...hiddenPositions });
  }
  logger.log(TAG, 'wrappedFields', { wrappedFields });
  return wrappedFields;
};

type WithAssociation = {
  ifFilterField: boolean;
  type: 'ManyToMany';
  options: {
    filterType: 'Sort';
  };
};

type AssociationField = {
  associations: {
    [name: string]: {
      items: any[];
      /**
       * 分页拉取的关联数据大部分情况下并不包含在当前以选择的数据列表中
       * 该对象用于拉取这部分数据的补充信息，以用于界面填充
       */
      existItems: any[];
      page: number;
      size: number;
      total: number;
      query: {
        where: any;
        parsedFields: {
          fields: string[];
          relatedFieldsMap: object;
        };
        skip: number;
        take: number;
      };
    };
  };
  foreignOpts: Asuna.Schema.ForeignOpt[];
  isFilterFields: boolean;
  options: {
    filterType: 'Sort';
    selectable: string;
  };
};

const extractItems = R.compose(
  R.uniqBy(R.prop('id')),
  R.flatten,
  R.map(R.path(['data', 'items'])),
  R.flatten,
);

/**
 * 异步加载所有的关联对象，用于下拉菜单提示
 * @param fields
 * @returns {Promise<*>}
 */
export const asyncLoadAssociationsDecorator = async (
  fields: (Fields & WithHidden & WithAssociation) | PositionsField | EnumField,
): Promise<(Fields & WithHidden) | PositionsField | EnumField | AssociationField> => {
  const TAG = '[asyncLoadAssociationsDecorator]';
  logger.log(TAG, { fields });

  const relationShips = [DynamicFormTypes.Association, DynamicFormTypes.ManyToMany];
  const associations = R.filter(field => R.contains(field.type)(relationShips))(fields);

  if (R.not(R.isEmpty(associations))) {
    logger.debug(TAG, 'associations is', associations);

    // 当已经拉取过数据后不再进行拉取，在这里认为如果已存在的 items 数量和 value 中的不一致，则重新拉取
    // TODO 如果按第一次已经拉取过来看，其实不需要再次拉取，相关数据应该从组件中传出
    // const filteredAssociations = R.pickBy(field => R.not(R.has('associations', field)))(
    const filteredAssociations = R.pickBy(
      field =>
        idx(field, _ => _.associations[field.name].existItems.length) !=
        idx(field, _ => _.value.length),
    )(associations);
    logger.log(TAG, { filteredAssociations });
    if (R.isEmpty(filteredAssociations)) {
      return fields;
    }

    // TODO add onSearch query in options
    const wrappedAssociations = await Promise.all(
      R.values(filteredAssociations).map(async field => {
        const selectable = R.pathOr([], ['options', 'selectable'])(field);
        logger.debug(TAG, { field, selectable });
        if (selectable) {
          const fieldsOfAssociations = AppContext.adapters.models.getFieldsOfAssociations();

          const foreignOpts = [
            {
              modelName: selectable,
              association: fieldsOfAssociations[selectable],
              onSearch: _.debounce(async (value, callback) => {
                logger.log(TAG, 'onSearch', { value });

                AppContext.adapters.models
                  .loadAssociation(selectable, { keywords: value })
                  .then(response => {
                    const items = extractItems([response]);
                    callback(items);
                  })
                  .catch(reason => {
                    logger.error(TAG, reason);
                  });
              }, 500),
            },
          ];
          logger.debug(TAG, { fieldsOfAssociations, foreignOpts });

          try {
            const results = await bluebird.props({
              itemsResponse: AppContext.adapters.models.loadAssociation(selectable),
              existItemsResponse: AppContext.adapters.models.loadAssociationByIds(
                selectable,
                field.value,
              ),
            });

            // 当前方法只处理了单个外键的情况，没有考虑如联合主键的处理
            const foreignKeysResponse = {
              [selectable]: {
                items: _.compact(extractItems([results.itemsResponse])),
                existItems: _.compact(extractItems([results.existItemsResponse])),
              },
            };
            logger.debug(TAG, { foreignOpts, foreignKeysResponse });
            return { ...field, foreignOpts, associations: foreignKeysResponse };
          } catch (e) {
            logger.error(TAG, e);
          }
        }
        logger.warn(TAG, 'no foreignKeys with association', { field });
        return { ...field, type: DynamicFormTypes.Input };
      }),
    );

    const pairedWrappedAssociations = R.zipObj(R.keys(filteredAssociations), wrappedAssociations);
    logger.debug(TAG, { pairedWrappedAssociations });

    // FIXME 临时解决关联数据从 entities 到 ids 的转换

    const transformedAssociations = R.map(association => {
      let value;
      if (_.isArrayLike(association.value)) {
        value = association.value
          ? R.map(entity => R.propOr(entity, 'id', entity))(association.value)
          : undefined;
      } else {
        value = association.value
          ? R.propOr(association.value, 'id', association.value)
          : undefined;
      }
      return { ...association, value };
    })(pairedWrappedAssociations);

    logger.debug(TAG, { transformedAssociations });

    return R.mergeDeepRight(fields, transformedAssociations);
  }

  return fields;
};

/**
 * 自动通过公共 associations 填充未定义的关联
 * @param fields
 * @returns {*}
 */
export const associationDecorator = fields => {
  const TAG = '[associationDecorator]';
  logger.log(TAG, { fields });

  // prettier-ignore
  const associationFields = R.filter(R.compose(R.not, R.isNil, R.prop('associations')))(fields);
  logger.log(TAG, { associationFields }, R.not(R.isEmpty(associationFields)));
  if (R.not(R.isEmpty(associationFields))) {
    const wrapForeignOpt = R.map(opt => ({
      ...opt,
      association: AppContext.adapters.models.getAssociationConfigs(opt.modelName),
    }));
    const withAssociations = R.mapObjIndexed(field => ({
      ...field,
      foreignOpts: wrapForeignOpt(field.foreignOpts),
    }))(associationFields);
    logger.debug(TAG, { withAssociations, wrapForeignOpt });

    const wrappedFields = R.mergeDeepRight(fields, withAssociations);
    logger.debug(TAG, { wrappedFields });

    return wrappedFields;
  }

  return fields;
};

export const jsonDecorator = (
  fields: (Fields & WithHidden) | PositionsField,
): (Fields & WithHidden) | PositionsField => {
  const TAG = '[jsonDecorator]';
  logger.log(TAG, { fields });

  const jsonFields = R.filter(R.pathEq(['options', 'json'], 'str'))(fields);
  if (R.not(R.isEmpty(jsonFields))) {
    logger.debug(TAG, { jsonFields });

    const toJson = value => {
      if (R.is(String, value) && value.length) {
        try {
          return JSON.parse(value);
        } catch (e) {
          logger.warn(TAG, e, { jsonFields });
          return null;
        }
      }
      if (R.is(Object, value)) {
        return value;
      }
      return null;
    };

    const transformValue = R.over(R.lens(R.prop('value'), R.assoc('value')), toJson);
    const transformedFields = R.map(transformValue)(jsonFields);
    const wrappedFields = R.mergeDeepRight(fields, transformedFields);

    logger.log(TAG, 'wrappedFields', { wrappedFields });
    return wrappedFields;
  }

  return fields;
};

type EnumField = {
  type: DynamicFormTypes.EnumFilter;
  options: {
    enumData: { key: string; value: any[] }[];
    type: DynamicFormTypes.EnumFilter;
    filterType: 'Sort';
  };
};

/**
 * 通过 Enum 定义中的 enum_data 的 key 值拉取相应 schema 中的关联
 * 通过所有的被选关联字段的 schema name 和 key 比较
 * 目前认为每个 model schema 只有一个 enum filter 定义
 * @param fields
 * @returns {*}
 */
export const enumDecorator = (
  fields: (Fields & WithHidden) | PositionsField | EnumField,
): (Fields & WithHidden) | PositionsField | EnumField => {
  const TAG = '[enumDecorator]';
  logger.log(TAG, { fields });

  const enumFilterFields = R.filter(R.propEq('type', DynamicFormTypes.EnumFilter))(fields);
  if (R.not(R.isEmpty(enumFilterFields))) {
    const [, enumFilterField] = R.toPairs(enumFilterFields)[0];
    logger.debug(TAG, { enumFilterField });

    const enums = _.map(
      _.keys(idx(enumFilterField as EnumField, _ => _.options.enumData)),
      castModelName,
    );
    const current = castModelName(R.pathOr('', ['value'])(enumFilterField));
    logger.debug(TAG, { enums, current });

    // check if positions has value already
    // save positions value if no value exists, update models' sequence for else
    const positionsFieldPair = R.compose(
      R.toPairs,
      R.map(field => {
        // raw is the original value, if exists, means it's update request
        if (field.value && !field.raw) {
          const value = R.is(String, field.value) ? JSON.parse(field.value) : field.value;
          return { ...field, value, raw: field.value };
        }
        return { ...field, value: R.path([current, 'value'])(fields), raw: field.value };
      }),
      R.filter(R.pathEq(['options', 'type'], 'SortPosition')),
    )(fields);

    const filteredNames = R.without(current)(enums);
    const filteredFields = R.omit(filteredNames)(fields);
    const wrappedFields = current
      ? R.mergeDeepRight(filteredFields, {
          [current]: {
            isFilterField: true,
            options: { filterType: R.path(['options', 'filterType'])(enumFilterField) },
            value: R.isEmpty(positionsFieldPair)
              ? R.path([current, 'value'])(filteredFields)
              : R.path([0, 1, 'value'])(positionsFieldPair),
          },
          ...R.fromPairs(positionsFieldPair),
        })
      : filteredFields;

    logger.debug(TAG, 'wrappedFields', {
      current,
      filteredNames,
      filteredFields,
      wrappedFields,
      positionsFieldPair,
    });

    return wrappedFields;
  }

  return fields;
};
