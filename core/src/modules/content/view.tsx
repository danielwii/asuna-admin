import { AsunaDataView, ErrorInfo, FormFieldType } from '@asuna-admin/components';
import { DebugInfo, extractModelNameFromPane, resolveModelInPane, TenantHelper } from '@asuna-admin/helpers';
import 'highlight.js/styles/default.css';
import * as _ from 'lodash';
import * as React from 'react';
import { useAsync } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';
import { ModulesLoaderProps } from '..';

export type QueryFieldsColumnProps<EntitySchema> = (keyof EntitySchema)[];

const ContentView: React.FC<ModulesLoaderProps> = ({ module, basis: { pane } }) => {
  // const { store } = React.useContext(StoreContext);
  // const [viewRecord, setViewRecord] = React.useState();

  const { modelName, extraName } = extractModelNameFromPane(pane);
  // const { relations } = useAsunaModels(modelName, { extraName });
  const { modelConfig, primaryKey, columnOpts } = resolveModelInPane(modelName, extraName);

  const { loading, value, error } = useAsync(() => {
    console.log('async load...');
    return TenantHelper.resolveBindModel();
  });

  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  const fields = _.fromPairs(
    _.map(columnOpts?.columnProps?.queryFields || [primaryKey], value => {
      return [value, { name: value as string, type: FormFieldType.string }];
    }),
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
