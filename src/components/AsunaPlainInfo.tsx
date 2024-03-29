import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { List, Tooltip } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import moment from 'moment';
import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import VisualDiff from 'react-visual-diff';

import { AppContext } from '../core/context';
import { AsunaDefinitions } from '../core/definitions';
import { WithDebugInfo } from '../helpers/debug';
import { DynamicFormTypes } from './DynamicForm/types';
import { AsunaContent, WithLoading, WithVariable, parseString } from './base/helper/helper';
import { AssetsPreview } from './base/preview-button/asset-preview';

import type { EnumFilterMetaInfoOptions } from '@danielwii/asuna-shared';

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
        schema: AppContext.getSchema(modelName),
        formSchema: AppContext.getFormSchema(modelName),
      }),
    [modelName, record, compare],
  );

  useLogger('<[AsunaPlainInfo]>', { modelName, record, compare });

  return (
    <WithLoading loading={loading} error={error}>
      <WithVariable variable={value}>
        {({ record, compare, formSchema, schema }) => (
          <WithDebugInfo info={{ modelName, schema }}>
            <List<{ key: string; title: string; value: any }>
              split
              size="small"
              itemLayout="horizontal"
              header={schema?.info?.displayName && <legend>{schema.info.displayName}</legend>}
              dataSource={_.map(record, (value, key) => ({
                key,
                title: fields[key]?.options?.name ?? fields[key]?.options?.label ?? fields[key]?.name,
                value,
              }))}
              renderItem={(item) => {
                const itemSchema = formSchema?.[item.key];
                const columnInfo = _.find(schema?.columns, (column) => column.name === item.key);

                if (!columnInfo || columnInfo.config?.info?.accessible === 'hidden') return <React.Fragment />;

                const title = columnInfo.config?.info?.name ?? item.title;

                let value = record?.[item.key];
                let before = compare?.[item.key];

                const renderObject = AsunaDefinitions.renders.find(fp.isMatch({ model: modelName, field: item.key }));
                if (renderObject) {
                  value = renderObject.render(value);
                  before = renderObject.render(before);

                  return (
                    <List.Item style={{ alignItems: 'start' }}>
                      <List.Item.Meta
                        title={title}
                        description={
                          <WithDebugInfo
                            info={{ item, value: record?.[item.key], columnInfo, itemSchema, renderObject }}
                          >
                            {compare ? <VisualDiff left={<div>{before}</div>} right={<div>{value}</div>} /> : value}
                          </WithDebugInfo>
                        }
                      />
                      {/*
                      <div style={{ flex: 2, textAlign: 'end' }}>
                        <WithDebugInfo info={{ item, value: record?.[item.key], columnInfo, itemSchema, renderObject }}>
                          {compare ? <VisualDiff left={<div>{before}</div>} right={<div>{value}</div>} /> : value}
                        </WithDebugInfo>
                      </div>
*/}
                    </List.Item>
                  );
                }

                if (columnInfo.config?.type === 'datetime') {
                  value = (
                    <Tooltip title={value}>
                      <>
                        {moment(value).calendar()}
                        <div>{moment(value).fromNow()}</div>
                      </>
                    </Tooltip>
                  );
                  before = before && (
                    <Tooltip title={before}>
                      <>
                        {moment(before).calendar()}
                        <div>{moment(before).fromNow()}</div>
                      </>
                    </Tooltip>
                  );
                } else {
                  value = parseString(value);
                  before = parseString(before);
                }

                switch (columnInfo.config?.info?.type as any) {
                  case DynamicFormTypes.EnumFilter: {
                    const info = columnInfo.config?.info as EnumFilterMetaInfoOptions;
                    value = info?.enumData?.[value as string];
                    before = before && info?.enumData?.[before as string];
                    break;
                  }
                  case DynamicFormTypes.Images:
                  case DynamicFormTypes.Image: {
                    value = <AssetsPreview urls={value} />;
                    before = before && <AssetsPreview urls={before} />;
                    break;
                  }
                  case DynamicFormTypes.File: {
                    value = <AsunaContent value={value as any} link />;
                    before = before && <AsunaContent value={before as any} link />;
                    break;
                  }
                }

                return (
                  <List.Item style={{ alignItems: 'start' }}>
                    <List.Item.Meta title={title} />
                    <div style={{ flex: 2, textAlign: 'end' }}>
                      <WithDebugInfo info={{ item, value: record?.[item.key], columnInfo, itemSchema, renderObject }}>
                        {compare ? <VisualDiff left={<div>{before}</div>} right={<div>{value}</div>} /> : value}
                      </WithDebugInfo>
                    </div>
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
