import { RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import { DependencyList, useState } from 'react';
import { useAsync } from 'react-use';
import { AppContext } from '../core/context';

const logger = createLogger('helpers:hooks');

export function useAsunaModels(
  modelName: string,
  { extraName, callRefresh, actions }: { actions?; extraName?; callRefresh? } = {},
  deps?: DependencyList,
): {
  loading: boolean;
  columnProps: RelationColumnProps[];
  relations?: string[];
  originSchemas: {
    columnProps: Asuna.Schema.ModelSchema[];
    manyToManyRelations: Asuna.Schema.ModelSchema[];
    manyToOneRelations: Asuna.Schema.ModelSchema[];
    oneToManyRelations: Asuna.Schema.ModelSchema[];
  };
} {
  const [state, setState] = useState<{ columnProps: RelationColumnProps[]; schemas; loading: boolean }>({
    columnProps: [],
    schemas: {},
    loading: true,
  });
  useAsync(async () => {
    logger.log('useAsunaModels getColumns ...');
    // const hasGraphAPI = _.find(await AppContext.ctx.graphql.loadGraphs(), schema => schema === `sys_${modelName}`);
    const columnProps = await AppContext.adapters.models.getColumns(
      modelName,
      { callRefresh, actions },
      extraName || modelName,
    );

    logger.log('useAsunaModels loadOriginSchema ...');
    const schemas = await AppContext.adapters.models.loadOriginSchema(modelName);

    setState({ columnProps, schemas, loading: false });
  }, deps);

  const relations = _.flow([fp.mapValues(fp.get('relation')), _.values, _.compact, _.uniq])(state.columnProps);

  logger.log('useAsunaModels', modelName, state, { relations });
  return { loading: state.loading, columnProps: state.columnProps, relations, originSchemas: state.schemas };
}
