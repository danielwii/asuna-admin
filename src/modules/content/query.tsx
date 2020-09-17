import { AsunaDataView } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { extractModelNameFromPane, resolveModelInPane, useAsunaModels } from '@asuna-admin/helpers';
import { Divider, PageHeader } from 'antd';
import { EasyForm, FormFieldType } from 'asuna-components';
import 'highlight.js/styles/default.css';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import * as React from 'react';
import { useState } from 'react';
import { ModulesLoaderProps } from '..';

export type QueryFieldsColumnProps<EntitySchema> = (keyof EntitySchema)[];

const ContentSearch: React.FC<ModulesLoaderProps> = (props) => {
  const {
    basis: { pane },
  } = props;
  // const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [viewRecord, setViewRecord] = useState<any>();

  const { modelName, extraName } = extractModelNameFromPane(props.basis.pane);
  const { relations } = useAsunaModels(modelName, { extraName });
  const { modelConfig, primaryKey, columnOpts } = resolveModelInPane(modelName, extraName);

  /*
  useEffect(() => {
    setIsOnline(true);
    console.log('set online', true);

    return () => {
      setIsOnline(false);
      console.log('set online', false);
    };
  }, [props.module]);
*/

  const fields = _.fromPairs(
    _.map(columnOpts?.columnProps?.queryFields || [primaryKey], (value) => {
      return [value, { name: value as string, type: FormFieldType.string }];
    }),
  );
  /*{
    [primaryKey]: {
      name: primaryKey,
      type: FormFieldType.string,
      validate: value => null,
      // defaultValue: 'body.url',
      // help: '分享链接',
    },
  };*/

  return (
    <>
      {/*<pre>{util.inspect(columnOpts?.columnProps?.queryFields)}</pre>*/}
      {/*<pre>{util.inspect(fields)}</pre>*/}

      <PageHeader title={pane.title}>
        <EasyForm
          initialValues={{}}
          fields={fields}
          onSubmit={async (values) => {
            const valuesByFields = _.mapValues(fields, (v, k) => {
              const v1 = _.get(values, k);
              const v2 = _.get(_.omit(values, k), k);
              return v1 ?? v2;
            });
            const hasFields = _.filter(valuesByFields, (value) => !(_.isUndefined(value) || _.isNull(value)));
            if (!_.isEmpty(hasFields)) {
              const keys = _.keys(fields);
              if (keys.length === 1 && keys.includes(primaryKey)) {
                const record = await AppContext.ctx.models
                  .fetch2(modelName, { id: valuesByFields[primaryKey], relations })
                  .then(fp.get('data'));
                setViewRecord(record);
              } else {
                const data = await AppContext.ctx.models.loadModels2(modelName, { filters: valuesByFields, relations });
                setViewRecord(_.head(data.items));
              }
            }
          }}
          // onClear={() => ComponentsHelper.clear({ key, collection }, refetch)}
        />
      </PageHeader>

      <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />

      <AsunaDataView modelName={modelName} extraName={extraName} data={viewRecord} onBack={() => setViewRecord(null)} />

      {/*
      <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />

      <AsunaDataTable
        modelName={modelName}
        extraName={extraName}
        models={content.models}
        onView={(text, record) => setViewRecord(record)}
        rowClassName={columnOpts?.rowClassName}
      />
*/}
    </>
  );
};

export default ContentSearch;
