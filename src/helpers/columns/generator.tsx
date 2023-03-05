import { EditTwoTone } from '@ant-design/icons';

import { Badge, Button, List, Modal, Tooltip, Typography, message } from 'antd';
import { ColumnProps } from 'antd/es/table';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import * as React from 'react';
import { useEffect } from 'react';
import useAsync from 'react-use/lib/useAsync';
import useToggle from 'react-use/lib/useToggle';
import util from 'util';

import { parseAddressStr } from '../../components/Address';
import { DynamicFormTypes } from '../../components/DynamicForm/types';
import { FormModalButton } from '../../components/FormModalButton';
import { ErrorInfo } from '../../components/base/error';
import { AsunaContent } from '../../components/base/helper/helper';
import { Loading } from '../../components/base/loading';
import { AppContext } from '../../core/context';
import { createLogger } from '../../logger';
import { columnHelper, generateSearchColumnProps } from '../columns/columns';
import { nullProtectRender, parseType } from '../columns/utils';
import { WithDebugInfo } from '../debug';
import { extractValue } from '../func';

import type { Asuna } from '../../types/asuna';
import type { ModelOpts, TextColumnOpts } from '../columns/types';

const logger = createLogger('helpers:columns:generator');

export const ProtectedFieldViewer: React.FC<{ modelName: string; id: string | number; field: string }> = ({
  field,
  modelName,
  id,
}) => {
  const [view, toggle] = useToggle(false);

  const state = useAsync(async () => {
    if (view) {
      const response = await AppContext.ctx.models.loadProtectedField(modelName, id, field);
      return _.get(response, 'data.value');
    }
  }, [view]);

  // auto hidden in 10s
  useEffect(() => {
    if (view) setTimeout(() => toggle(), 10000);
  }, [view]);

  // useLogger('<[ProtectedFieldView]>', { field, modelName, id, view }, state);

  if (!view)
    return (
      <Button type="dashed" size="small" onClick={toggle}>
        查看
      </Button>
    );
  if (state.loading) return <Loading type="pulse" />;
  if (state.error)
    return (
      <ErrorInfo>
        <>
          <pre>{JSON.stringify(state.error, null, 2)}</pre>
        </>
      </ErrorInfo>
    );
  return <Typography.Text copyable={!!state.value}>{state.value}</Typography.Text>;
};

export class ColumnsHelper {
  static async generate(
    key: string,
    { model, title, ctx, callRefresh }: ModelOpts,
    opts: TextColumnOpts = {},
  ): Promise<ColumnProps<any>> {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const isProtected = columnInfo?.config.info.protected;
    logger.info('generate', { key, model, title, ctx, opts, columnInfo, isProtected });
    return {
      key,
      title: title ?? columnInfo?.config?.info?.name ?? key,
      dataIndex: key,
      sorter: true,
      ...(await generateSearchColumnProps(key, ctx.onSearch, opts.searchType, { model })),
      render: nullProtectRender((value, record) => {
        if (isProtected) return <ProtectedFieldViewer modelName={model} id={record.id} field={key} />;

        let extracted = extractValue(value, opts.transformer);
        if (opts.parseBy) extracted = parseType(opts.parseBy, extracted);
        if (columnInfo?.config?.info?.type === DynamicFormTypes.Address) extracted = parseAddressStr(extracted);
        let prefix: React.ReactNode = '';
        if (opts.badge) {
          const status = opts.badge(_.get(record, 'status'));
          prefix = <Badge status={status} />;
        }

        let view;
        if (opts.mode === 'html') {
          view = extracted ? (
            <Button
              size="small"
              type="dashed"
              onClick={() =>
                Modal.info({ maskClosable: true, content: <div dangerouslySetInnerHTML={{ __html: extracted }} /> })
              }
            >
              预览
            </Button>
          ) : (
            'n/a'
          );
        } else if (opts.mode === 'json') {
          if (_.isArray(extracted)) {
            view = (
              <>
                <List size="small">
                  {_.map(extracted, (item, index) => (
                    <List.Item key={index}>{JSON.stringify(item)}</List.Item>
                  ))}
                </List>
                <FormModalButton
                  onRefresh={callRefresh}
                  title="edit"
                  openButton={(showModal) => <EditTwoTone onClick={showModal} />}
                  onSubmit={async (values) => {
                    logger.info('values is', values);
                    try {
                      await AppContext.ctx.models.upsert(model, { body: { id: record.id, [key]: values[key] } });
                      message.success(`更新 ${model} ${record.id} 的 ${key} 成功`);
                    } catch (e) {
                      message.error(`更新 ${model} ${record.id} 的 ${key} 失败：${e}`);
                      return Promise.reject(e);
                    }
                  }}
                  fields={{
                    [key]: {
                      name: key,
                      type: DynamicFormTypes.SimpleJSON,
                      options: { required: true, name: title },
                      value: extracted,
                    },
                  }}
                />
              </>
            );
          } else
            view = extracted ? (
              <Tooltip title={util.inspect(extracted)}>
                <Button
                  size="small"
                  type="dashed"
                  onClick={() => Modal.info({ maskClosable: true, content: <div>{util.inspect(extracted)}</div> })}
                >
                  预览
                </Button>
              </Tooltip>
            ) : (
              'n/a'
            );
        } else if (opts.mode === 'button') {
          const content = opts.render ? opts.render(extracted, record) : extracted;
          view = extracted ? (
            <Button size="small" type="dashed" onClick={() => Modal.info({ maskClosable: true, content })}>
              预览
            </Button>
          ) : (
            'n/a'
          );
        } else {
          view = opts.render ? opts.render(extracted, record) : <AsunaContent value={extracted} />;
        }

        return (
          <WithDebugInfo info={{ key, title, model, value, record, extracted, opts, columnInfo }}>
            {prefix} {view}
          </WithDebugInfo>
        );
      }),
    };
  }
  static fpGenerateSwitch = (key, opts: ModelOpts, extras: Asuna.Schema.RecordRenderExtras) =>
    _.curry(columnHelper.generateSwitch)(key, opts, extras);
}
