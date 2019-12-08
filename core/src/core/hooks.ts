import { Asuna } from '@asuna-admin/types';
import { ColumnProps } from 'antd/es/table';
import * as R from 'ramda';
import { useEffect, useState } from 'react';
import { AppContext } from './context';

export function useAsunaModels(
  modelName: string,
  { extraName, callRefresh, actions }: { actions?; extraName?; callRefresh? } = {},
): {
  columns: (ColumnProps<any> & { relation: any })[];
  relations?: string[];
  schemas: {
    columns: Asuna.Schema.ModelSchema[];
    manyToManyRelations: Asuna.Schema.ModelSchema[];
    manyToOneRelations: Asuna.Schema.ModelSchema[];
    oneToManyRelations: Asuna.Schema.ModelSchema[];
  };
} {
  const [columns, setColumns] = useState<(ColumnProps<any> & { relation: any })[]>([]);
  useEffect(() => {
    // todo ???
    // const hasGraphAPI = _.find(await AppContext.ctx.graphql.loadGraphs(), schema => schema === `sys_${modelName}`);
    AppContext.adapters.models.getColumns(modelName, { callRefresh, actions }, extraName || modelName).then(columns => {
      console.log({ columns });
      setColumns(columns);
    });
  }, [modelName]);

  const [schemas, setSchemas] = useState();
  useEffect(() => {
    AppContext.adapters.models.loadOriginSchema(modelName).then(schemas => {
      console.log({ schemas });
      setSchemas(schemas);
    });
  }, [modelName]);

  const relations = R.compose(
    R.filter(R.compose(R.not, R.isEmpty)),
    R.map(R.values),
    R.map(R.pick(['relation'])),
  )(columns);

  return { columns, relations, schemas };
}
