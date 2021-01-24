import { DynamicFormField, DynamicFormFieldOptions, DynamicFormTypes } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { castModelKey, castModelName, diff } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import * as _ from 'lodash';
import * as R from 'ramda';

const logger = createLogger('helpers:schema');

export * from './async';
export * from './helper';

export const peek = (message, callback?) => (fields) => {
  if (callback) callback();
  logger.log('[peek]', { message, fields });
  return fields;
};

export type Fields = { [key: string]: DynamicFormField };

export type WithHidden = { options: { hidden?: boolean } };

export type PositionsField = Fields &
  WithHidden &
  DeepPartial<{
    options: {
      accessible: 'readonly';
      json: 'str';
      type: 'SortPosition';
    };
  }>;

export const hiddenComponentDecorator = ({
  modelName,
  fields,
}: {
  modelName: string;
  fields: Fields;
}): { modelName; fields: Fields & WithHidden } => {
  const TAG = '[hiddenComponentDecorator]';
  logger.log(TAG, { fields });

  const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
  let wrappedFields = R.omit([castModelKey('createdAt'), castModelKey('updatedAt')])(fields) as Fields & WithHidden;
  if (R.has(primaryKey, wrappedFields)) {
    const hidden = R.isNil(wrappedFields[primaryKey].value);
    wrappedFields = R.mergeDeepRight(wrappedFields, {
      [primaryKey]: { options: { accessible: hidden ? 'hidden' : null } as DynamicFormFieldOptions },
    });
  }

  const positions = R.filter(R.pathEq(['options', 'type'], 'SortPosition'))(wrappedFields);
  if (!R.isEmpty(positions)) {
    const hiddenPositions = R.map<any, any>((position) => ({
      ...position,
      options: { accessible: 'hidden' } as DynamicFormFieldOptions,
    }))(positions as any) as DynamicFormFieldOptions;

    wrappedFields = R.mergeDeepRight(wrappedFields, { ...hiddenPositions });
  }
  logger.log(TAG, 'wrappedFields', { wrappedFields }, diff(fields, wrappedFields));
  return { modelName, fields: wrappedFields };
};

export const dynamicTypeDecorator = ({
  modelName,
  fields,
}: {
  modelName: string;
  fields: Fields;
}): { modelName; fields: Fields } => {
  const TAG = '[dynamicTypeDecorator]';
  const { columns } = AppContext.ctx.models.getModelConfig(modelName);
  logger.log(TAG, { fields, columns });

  const typePairs = Object.assign({}, ..._.map(columns, (column, key) => ({ [key]: { type: column.editor(fields) } })));

  logger.log(TAG, { typePairs });

  const wrappedFields = R.mergeDeepRight(fields, typePairs);

  logger.log(TAG, { wrappedFields }, diff(fields, wrappedFields));
  return { modelName, fields: wrappedFields };
};

/**
 * 自动通过公共 associations 填充未定义的关联
 */
export const associationDecorator = ({ modelName, fields }: { modelName: string; fields }) => {
  const TAG = '[associationDecorator]';
  logger.log(TAG, { fields });

  // prettier-ignore
  const associationFields = R.filter(R.compose(R.not, R.isNil, R.prop('associations')))(fields);
  logger.log(TAG, { associationFields }, R.not(R.isEmpty(associationFields)));
  if (R.not(R.isEmpty(associationFields))) {
    const wrapForeignOpt = R.map<any, any>((opt) => ({
      ...opt,
      association: AppContext.adapters.models.getAssociationConfigs(opt.modelName),
    }));
    const withAssociations = R.mapObjIndexed<any, any>((field) => ({
      ...field,
      foreignOpts: wrapForeignOpt(field.foreignOpts),
    }), associationFields);
    logger.debug(TAG, { withAssociations, wrapForeignOpt });

    const wrappedFields = R.mergeDeepRight(fields, withAssociations);
    logger.debug(TAG, { wrappedFields });

    return { modelName, fields: wrappedFields };
  }

  return { modelName, fields };
};

export const jsonDecorator = ({
  modelName,
  fields,
}: {
  modelName: string;
  fields: (Fields & WithHidden) | PositionsField;
}): { modelName; fields: (Fields & WithHidden) | PositionsField } => {
  const TAG = '[jsonDecorator]';
  logger.log(TAG, { fields });

  const jsonFields = R.filter(R.pathEq(['options', 'json'], 'str'))(fields);
  if (R.not(R.isEmpty(jsonFields))) {
    logger.debug(TAG, { jsonFields });

    const toJson = (value) => {
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
    const transformedFields = R.map(transformValue)(jsonFields as any);
    const wrappedFields = R.mergeDeepRight(fields, transformedFields);

    logger.log(TAG, 'wrappedFields', { wrappedFields });
    return { modelName, fields: wrappedFields };
  }

  return { modelName, fields };
};

export type EnumField = {
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
 */
export const enumDecorator = ({
  modelName,
  fields,
}: {
  modelName: string;
  fields: (Fields & WithHidden) | PositionsField | EnumField;
}): { modelName; fields: (Fields & WithHidden) | PositionsField | EnumField } => {
  const TAG = '[enumDecorator]';
  logger.log(TAG, { fields });

  const enumFilterFields = R.filter(R.propEq('type', DynamicFormTypes.EnumFilter))(fields as any);
  if (R.not(R.isEmpty(enumFilterFields))) {
    const [, enumFilterField] = R.toPairs(enumFilterFields)[0];
    logger.debug(TAG, { enumFilterField });

    const enums = _.map(_.keys((enumFilterField as EnumField)?.options?.enumData), castModelName);
    const current = castModelName(R.pathOr('', ['value'])(enumFilterField));
    logger.debug(TAG, { enums, current });

    // check if positions has value already
    // save positions value if no value exists, update models' sequence for else
    const positionsFieldPair = R.compose(
      R.toPairs,
      R.map<any, any>((field) => {
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
    const filteredFields = R.omit(filteredNames as any)(fields);
    const wrappedFields: any = current
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

    return { modelName, fields: wrappedFields };
  }

  return { modelName, fields };
};
