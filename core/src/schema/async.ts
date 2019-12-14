import { DynamicFormTypes } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Promise } from 'bluebird';
import * as _ from 'lodash';
import * as R from 'ramda';

import { EnumField, Fields, PositionsField, WithHidden } from '.';

const logger = createLogger('helpers:schema:async');

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

const extractItemsBy = primaryKey =>
  R.compose(R.uniqBy(R.prop(primaryKey)), R.flatten, R.map(R.path(['data', 'items'])), R.flatten);

/**
 * 异步加载所有的关联对象，用于下拉菜单提示
 */
export const asyncLoadAssociationsDecorator = async ({
  modelName,
  fields,
}: {
  modelName: string;
  fields: (Fields & WithHidden & WithAssociation) | PositionsField | EnumField;
}): Promise<{
  modelName;
  fields: (Fields & WithHidden) | PositionsField | EnumField | AssociationField;
}> => {
  const TAG = '[asyncLoadAssociationsDecorator]';
  logger.log(TAG, { fields });

  const relationShips = [DynamicFormTypes.Association, DynamicFormTypes.ManyToMany];
  const associations = R.filter(field => R.contains(field.type)(relationShips))(fields);

  if (R.not(R.isEmpty(associations))) {
    logger.debug(TAG, 'associations is', associations);

    // 当已经拉取过数据后不再进行拉取，在这里认为如果已存在的 items 数量和 value 中的不一致，则重新拉取
    // TODO 如果按第一次已经拉取过来看，其实不需要再次拉取，相关数据应该从组件中传出
    // const filteredAssociations = R.pickBy(field => R.not(R.has('associations', field)))(
    const filteredAssociations = R.pickBy(field => {
      const loaded = field?.associations?.[field.name];
      if (loaded) {
        return loaded?.existItems?.length != field?.value?.length;
      }
      return true;
    })(associations);
    logger.log(TAG, { filteredAssociations });
    if (R.isEmpty(filteredAssociations)) {
      return { modelName, fields };
    }

    // TODO add onSearch query in options
    const wrappedAssociations = await Promise.all(
      R.values(filteredAssociations).map(async field => {
        const selectable = R.pathOr([], ['options', 'selectable'])(field);
        logger.debug(TAG, { field, selectable });
        if (selectable) {
          const primaryKey = AppContext.adapters.models.getPrimaryKey(selectable);
          const fieldsOfAssociations = AppContext.adapters.models.getFieldsOfAssociations();

          const foreignOpts = [
            {
              modelName: selectable,
              association: fieldsOfAssociations[selectable],
              onSearch: async (value, callback) => {
                logger.log(TAG, 'onSearch', { value });

                AppContext.adapters.models
                  .loadAssociation(selectable, { keywords: value })
                  .then(response => {
                    const items = extractItemsBy(primaryKey)([response]);
                    callback(items);
                  })
                  .catch(reason => {
                    logger.error(TAG, reason);
                  });
              },
            },
          ];
          logger.debug(TAG, { fieldsOfAssociations, foreignOpts });

          try {
            const results = await Promise.props({
              itemsResponse: AppContext.adapters.models.loadAssociation(selectable),
              existItemsResponse: AppContext.adapters.models.loadAssociationByIds(selectable, field.value),
            });

            // 当前方法只处理了单个外键的情况，没有考虑如联合主键的处理
            const foreignKeysResponse = {
              [selectable]: {
                items: _.compact(extractItemsBy(primaryKey)([results.itemsResponse])),
                existItems: _.compact(extractItemsBy(primaryKey)([results.existItemsResponse])),
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
      const primaryKey = AppContext.adapters.models.getPrimaryKey(association.name);
      let value;

      if (_.isArray(association.value)) {
        value = association.value
          ? R.map(entity => R.propOr(entity, primaryKey, entity))(association.value)
          : undefined;
      } else {
        value = association.value ? R.propOr(association.value, primaryKey, association.value) : undefined;
      }
      logger.debug(TAG, 'handle association', { association, value, primaryKey });
      return { ...association, value };
    })(pairedWrappedAssociations);

    logger.debug(TAG, { transformedAssociations });

    return { modelName, fields: R.mergeDeepRight(fields, transformedAssociations) };
  }

  return { modelName, fields };
};
