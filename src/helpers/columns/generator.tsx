import { CopyOutlined } from '@ant-design/icons';

import { Button, Modal, message } from 'antd';
import { ColumnProps } from 'antd/es/table';
import { Promise } from 'bluebird';
import copy from 'copy-to-clipboard';
import * as _ from 'lodash';
import * as React from 'react';
import util from 'util';

import { parseAddressStr } from '../../components/Address';
import { DynamicFormTypes } from '../../components/DynamicForm/types';
import { TooltipContent } from '../../components/base/helper/helper';
import { AppContext } from '../../core/context';
import { createLogger } from '../../logger';
import { columnHelper, generateSearchColumnProps } from '../columns/columns';
import { nullProtectRender, parseType } from '../columns/utils';
import { WithDebugInfo } from '../debug';
import { extractValue } from '../func';

import type { Asuna } from '../../types/asuna';
import type { ModelOpts, TextColumnOpts } from '../columns/types';

const logger = createLogger('helpers:columns:generator');

export class ColumnsHelper {
  static async generate(
    key: string,
    { model, title, ctx }: ModelOpts,
    opts: TextColumnOpts = {},
  ): Promise<ColumnProps<any>> {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    return {
      key,
      title: title ?? columnInfo?.config?.info?.name ?? key,
      dataIndex: key,
      sorter: true,
      ...(await generateSearchColumnProps(key, ctx.onSearch, opts.searchType, { model })),
      render: nullProtectRender((value, record) => {
        let extracted = extractValue(value, opts.transformer);
        if (opts.parseBy) extracted = parseType(opts.parseBy, extracted);
        if (columnInfo?.config?.info?.type === DynamicFormTypes.Address) extracted = parseAddressStr(extracted);

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
          view = extracted ? (
            <Button
              size="small"
              type="dashed"
              onClick={() => Modal.info({ maskClosable: true, content: <div>{util.inspect(extracted)}</div> })}
            >
              预览
            </Button>
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
          view = opts.render ? (
            opts.render(extracted, record)
          ) : (
            <React.Fragment>
              <TooltipContent value={extracted} />
              {opts.copyable && (
                <CopyOutlined
                  onClick={() =>
                    copy(extracted, {
                      format: 'text/plain',
                      onCopy: () => message.success(`copied.`),
                    })
                  }
                />
              )}
            </React.Fragment>
          );
        }

        return (
          <WithDebugInfo info={{ key, title, model, value, record, extracted, opts, columnInfo }}>{view}</WithDebugInfo>
        );
      }),
    };
  }
  static fpGenerateSwitch = (key, opts: ModelOpts, extras: Asuna.Schema.RecordRenderExtras) =>
    _.curry(columnHelper.generateSwitch)(key, opts, extras);
}
