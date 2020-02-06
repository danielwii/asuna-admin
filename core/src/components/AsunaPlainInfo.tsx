import { AppContext } from '@asuna-admin/core';
import { parseString, WithDebugInfo } from '@asuna-admin/helpers';
import { SchemaHelper } from '@asuna-admin/schema';
import { List } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import React from 'react';
import { useAsync } from 'react-use';
import VisualDiff from 'react-visual-diff';
import { WithLoading, WithVariable } from './Common';

export interface AsunaPlainObjectProps {
  modelName: string;
  record: any | (() => Promise<any>);
  compare?: any | (() => Promise<any>);
}

export const AsunaPlainInfo: React.FC<AsunaPlainObjectProps> = ({ modelName, record, compare }) => {
  const fields = AppContext.adapters.models.getFormSchema(modelName);
  const { value, loading, error } = useAsync(
    () =>
      Promise.props({
        record: _.isFunction(record) ? record() : record,
        compare: _.isFunction(compare) ? compare() : compare,
        schema: SchemaHelper.getSchema(modelName),
        formSchema: SchemaHelper.getFormSchema(modelName),
      }),
    [modelName, record, compare],
  );

  return (
    <WithLoading loading={loading} error={error}>
      <WithVariable variable={value}>
        {({ record, compare, formSchema, schema }) => (
          <WithDebugInfo info={{ modelName, schema }}>
            <List<{ key: string; title: string; value: any }>
              itemLayout="horizontal"
              dataSource={_.map(record, (value, key) => ({
                key,
                title: fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
                value,
              }))}
              renderItem={item => {
                const columnInfo = _.find(schema?.columns, column => column.name === item.key);
                const title = columnInfo?.config?.info?.name ?? item.title;
                return (
                  <List.Item>
                    <List.Item.Meta
                      title={title}
                      description={
                        <WithDebugInfo info={{ item, record, value: record?.[item.key], columnInfo }}>
                          {compare ? (
                            <VisualDiff
                              left={<div>{parseString(compare?.[item.key] ?? '')}</div>}
                              right={<div>{parseString(record?.[item.key] ?? '')}</div>}
                            />
                          ) : (
                            <div>{parseString(record?.[item.key] ?? '')}</div>
                          )}
                        </WithDebugInfo>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </WithDebugInfo>
        )}
      </WithVariable>
    </WithLoading>
  );
};
