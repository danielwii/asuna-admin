import { adminProxyCaller, Draft, modelProxyCaller } from '@asuna-admin/adapters';
import { RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import { DependencyList, useState } from 'react';
import { useAsync, useAsyncRetry } from 'react-use';

const logger = createLogger('helpers:hooks');

export function useAsunaDrafts(
  params: { type: string; refId: string },
  deps?: DependencyList,
): { loading: boolean; drafts: Draft[]; retry: () => void } {
  const [loading, setLoading] = useState<boolean>(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const { retry } = useAsyncRetry(async () => {
    try {
      setLoading(true);
      if (params.type && params.refId) {
        const drafts = await adminProxyCaller().getDrafts(params);
        setDrafts(drafts);
      }
    } catch (e) {
      logger.error('useAsunaDrafts error', e);
    } finally {
      setLoading(false);
    }
  }, deps);

  return { loading, drafts, retry };
}

export function useAsunaModels(
  modelName: string,
  { extraName, callRefresh, actions, ctx }: { actions?; extraName?; callRefresh?; ctx: Asuna.Schema.TableContext },
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
    const columnProps = await modelProxyCaller().getColumns(modelName, { callRefresh, actions, ctx }, extraName);

    logger.log('useAsunaModels loadOriginSchema ...', columnProps);
    const schemas = await modelProxyCaller().loadOriginSchema(modelName);

    setState({ columnProps, schemas, loading: false });
  }, deps);

  const relations = _.flow([fp.mapValues(fp.get('relation')), _.values, _.compact, _.uniq])(state.columnProps);

  logger.log('useAsunaModels', modelName, state, { relations });
  return { loading: state.loading, columnProps: state.columnProps, relations, originSchemas: state.schemas };
}
