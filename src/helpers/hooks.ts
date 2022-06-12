import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import { DependencyList, useState } from 'react';
import { useAsync, useAsyncRetry } from 'react-use';

import { adminProxyCaller } from '../adapters/admin';
import { Draft } from '../adapters/admin.plain';
import { modelProxyCaller } from '../adapters/model';
import { createLogger } from '../logger';
import { Asuna } from '../types';

import type { RelationColumnProps } from './interfaces';

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
    logger.log('[useAsunaModels] getColumns ...', { modelName, extraName });
    // const hasGraphAPI = _.find(await AppContext.ctx.graphql.loadGraphs(), schema => schema === `sys_${modelName}`);
    // extraName 是作为 key 重复时的一个别名，这里假定 modelName 一定是 model 的原名，所以忽略 extraName
    const columnProps = await modelProxyCaller()
      .getColumns(modelName, { callRefresh, actions, ctx }, extraName)
      .catch((reason) => {
        console.error('ERROR Occurred', reason);
        return {} as any;
      });

    logger.log('useAsunaModels loadOriginSchema ...', columnProps);
    const schemas = await modelProxyCaller().loadOriginSchema(modelName);

    setState({ columnProps, schemas, loading: false });
  }, deps);

  const relations = _.flow([fp.mapValues(fp.get('relation')), _.values, _.compact, _.uniq])(state.columnProps);

  logger.log('[useAsunaModels]', modelName, state, { relations });
  return { loading: state.loading, columnProps: state.columnProps, relations, originSchemas: state.schemas };
}
