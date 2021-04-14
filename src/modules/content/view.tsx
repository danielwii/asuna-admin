import 'highlight.js/styles/default.css';
import * as _ from 'lodash';
import * as React from 'react';
import { useAsync, useLogger } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

import { AsunaDataView, ErrorInfo } from '../../components';
import { DebugInfo, extractModelNameFromPane, resolveModelInPane, TenantHelper } from '../../helpers';

import type { ModulesLoaderProps } from '..';

export type QueryFieldsColumnProps<EntitySchema> = (keyof EntitySchema)[];

const ContentView: React.FC<ModulesLoaderProps> = ({ module, basis: { pane } }) => {
  // const { store } = React.useContext(StoreContext);
  // const [viewRecord, setViewRecord] = React.useState();

  const { modelName, extraName } = extractModelNameFromPane(pane);
  // const { relations } = useAsunaModels(modelName, { extraName });
  const { modelConfig, primaryKey, columnOpts } = resolveModelInPane(modelName);

  const { loading, value, error } = useAsync(() => TenantHelper.resolveBindModel());

  useLogger('ContentView', { modelName, extraName, value, modelConfig, primaryKey, columnOpts });

  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  const fields = _.fromPairs(
    _.map(columnOpts?.columnProps?.queryFields || [primaryKey], (value) => [
      value,
      { name: value as string, type: 'string' },
    ]),
  );

  return (
    <>
      <AsunaDataView modelName={modelName} extraName={extraName} data={value} withActions />
      {/*<AsunaDataView modelName={modelName} extraName={extraName} data={viewRecord} onBack={() => setViewRecord(null)} />*/}
      <DebugInfo data={{ value, pane, fields }} divider type="util" />
    </>
  );
};

export default ContentView;
