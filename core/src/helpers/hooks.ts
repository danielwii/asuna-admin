import { RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import _ from 'lodash';
import * as fp from 'lodash/fp';
import { useEffect, useState } from 'react';
import { AppContext } from '../core/context';

const logger = createLogger('helpers:hooks');

export function useAsunaModels(
  modelName: string,
  { extraName, callRefresh, actions }: { actions?; extraName?; callRefresh? } = {},
): {
  columnProps: RelationColumnProps[];
  relations?: string[];
  originSchemas: {
    columnProps: Asuna.Schema.ModelSchema[];
    manyToManyRelations: Asuna.Schema.ModelSchema[];
    manyToOneRelations: Asuna.Schema.ModelSchema[];
    oneToManyRelations: Asuna.Schema.ModelSchema[];
  };
} {
  const [columnProps, setColumnProps] = useState<RelationColumnProps[]>([]);
  useEffect(() => {
    logger.log('useAsunaModels getColumns ...');
    // const hasGraphAPI = _.find(await AppContext.ctx.graphql.loadGraphs(), schema => schema === `sys_${modelName}`);
    AppContext.adapters.models
      .getColumns(modelName, { callRefresh, actions }, extraName || modelName)
      .then(columnProps => {
        logger.log({ columnProps });
        setColumnProps(columnProps);
      });
  }, [modelName]);

  const [originSchemas, setOriginSchemas] = useState();
  useEffect(() => {
    logger.log('useAsunaModels loadOriginSchema ...');
    AppContext.adapters.models.loadOriginSchema(modelName).then(schemas => {
      logger.log({ schemas });
      setOriginSchemas(schemas);
    });
  }, [modelName]);

  const relations = _.flow([fp.mapValues(fp.get('relation')), _.values, _.compact, _.uniq])(columnProps);

  logger.log('useAsunaModels', modelName, { columnProps, relations, originSchemas });
  return { columnProps, relations, originSchemas };
}
