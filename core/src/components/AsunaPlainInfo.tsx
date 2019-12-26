import VisualDiff from 'react-visual-diff';
import { List } from 'antd';
import { AppContext, ErrorInfo, parseString, WithDebugInfo } from 'asuna-admin';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import React from 'react';
import { useAsync } from 'react-use';
import { FoldingCube } from 'styled-spinkit';
import * as util from 'util';

export interface AsunaPlainObjectProps {
  modelName: string;
  record: any | (() => Promise<any>);
  compare?: any | (() => Promise<any>);
}

export const AsunaPlainInfo: React.FC<AsunaPlainObjectProps> = ({ modelName, record, compare }) => {
  const fields = AppContext.adapters.models.getFormSchema(modelName);
  const { value: values, loading, error } = useAsync(
    () =>
      Promise.props({
        record: _.isFunction(record) ? record() : record,
        compare: _.isFunction(compare) ? compare() : compare,
      }),
    [modelName],
  );

  if (loading) return <FoldingCube />;
  if (error)
    return (
      <ErrorInfo>
        <pre>{util.inspect(error)}</pre>
      </ErrorInfo>
    );

  return (
    <>
      <WithDebugInfo info={values} />
      <List<{ key: string; title: string; value: any }>
        itemLayout="horizontal"
        dataSource={_.map(record, (value, key) => ({
          key,
          title: fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
          value,
        }))}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={item.title}
              description={
                <WithDebugInfo info={{ item, value: values?.record?.[item.key], record }}>
                  {compare ? (
                    <VisualDiff
                      left={<div>{parseString(values?.compare?.[item.key] ?? '')}</div>}
                      right={<div>{parseString(values?.record?.[item.key] ?? '')}</div>}
                    />
                  ) : (
                    <div>{parseString(values?.record?.[item.key] ?? '')}</div>
                  )}
                </WithDebugInfo>
              }
            />
          </List.Item>
        )}
      />
    </>
  );
};
