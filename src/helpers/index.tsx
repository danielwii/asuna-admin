/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import { Badge, Button, Modal, Statistic, Tag, Tooltip } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import moment from 'moment';
import * as React from 'react';
import NumberFormat from 'react-number-format';
import * as util from 'util';

import { parseAddressStr } from '../components/Address';
import { DynamicFormTypes } from '../components/DynamicForm/types';
import { TooltipContent } from '../components/base/helper/helper';
import { AssetsPreview, PdfButton } from '../components/base/preview-button/asset-preview';
import { AppContext } from '../core/context';
import { valueToArrays } from '../core/url-rewriter';
import { createLogger } from '../logger';
import { castModelKey } from './cast';
import { columnHelper, generateSearchColumnProps } from './columns/columns';
import { nullProtectRender, parseType, ParseType } from './columns/utils';
import { ComponentsHelper } from './components';
import { WithDebugInfo } from './debug';
import { extractValue } from './func';

import type { ColumnProps } from 'antd/es/table';
import type { ConditionType, ModelOpts } from './columns/types';

const logger = createLogger('helpers');

interface TextColumnOpts {
  mode?: 'html' | 'json' | 'text' | 'button';
  /**
   * 用提供的转换器来转译
   */
  parseBy?: ParseType;
  /**
   * 内容修正
   */
  transformer?: ((record) => string) | string;
  searchType?: ConditionType;
  /**
   * 自定义渲染
   * @param content
   * @param record
   */
  render?: (content, record?) => React.ReactChild;
}
interface CommonColumnOpts {
  transformer?: ((o: any) => any) | string;
}

export const columnHelper2 = {
  generate: async (
    key: string,
    { model, title, ctx }: ModelOpts,
    opts: TextColumnOpts = {},
  ): Promise<ColumnProps<any>> => {
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
          view = opts.render ? opts.render(extracted, record) : <TooltipContent value={extracted} />;
        }

        return (
          <WithDebugInfo info={{ key, title, model, value, record, extracted, opts, columnInfo }}>{view}</WithDebugInfo>
        );
      }),
    };
  },
  generatePdf: async (key, modelOpts: ModelOpts, opts: TextColumnOpts = {}): Promise<ColumnProps<any>> =>
    columnHelper2.generate(key, modelOpts, {
      ...opts,
      render: (content, record) => <PdfButton pdf={content} />,
    }),
  generateLang: async (key, modelOpts: ModelOpts, opts: TextColumnOpts = {}): Promise<ColumnProps<any>> =>
    columnHelper2.generate(key, modelOpts, {
      ...opts,
      render: (content, record) => {
        if (content === 'zh') {
          return <div>🇨🇳{content}</div>;
        } else if (content === 'en') {
          return <div>🇺🇸{content}</div>;
        } else {
          return <div>{content}</div>;
        }
      },
    }),
  /**
   * 生成预览小图
   */
  generateImage: async (key, { model, title }: ModelOpts, opts: CommonColumnOpts = {}): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const titleStr = title ?? columnInfo?.config?.info?.name ?? key;
    return {
      key,
      title: titleStr,
      dataIndex: key,
      sorter: true,
      render: nullProtectRender((record) => {
        const value = extractValue(record, opts.transformer);
        return (
          <WithDebugInfo info={{ key, title, opts, record }}>
            {value ? <AssetsPreview key={key} urls={valueToArrays(value)} /> : record}
          </WithDebugInfo>
        );
      }),
    };
  },
  generateNumber: async (
    key,
    { model, title, ctx }: ModelOpts,
    opts: {
      transformer?: ((o: any) => any) | string;
      searchType?: ConditionType;
      type: 'badge' | 'statistics' | 'number';
    } = { type: 'number' },
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const titleStr = title ?? columnInfo?.config?.info?.name ?? key;
    return {
      key,
      title: titleStr,
      dataIndex: key,
      sorter: true,
      ...(await generateSearchColumnProps(key, ctx.onSearch, opts.searchType)),
      render: nullProtectRender((record) => {
        const value = extractValue(record, opts.transformer);
        if (opts.type === 'badge') {
          return _.isNil(value) ? (
            <span />
          ) : (
            <Badge
              showZero
              count={Number(value)}
              overflowCount={Number.MAX_SAFE_INTEGER}
              style={{ backgroundColor: '#52c41a' }}
            />
          );
        } else if (opts.type === 'number') {
          const value = extractValue(record, opts.transformer);
          return <NumberFormat value={value} displayType="text" thousandSeparator />;
        } else {
          return <Statistic value={Number(value)} />;
        }
      }),
    };
  },
  generateTag: async (
    key,
    { model, title, ctx }: ModelOpts,
    opts: {
      transformer?: (value) => string;
      colorMap?: {
        [key: string]:
          | null
          | 'magenta'
          | 'red'
          | 'volcano'
          | 'orange'
          | 'gold'
          | 'lime'
          | 'green'
          | 'cyan'
          | 'blue'
          | 'geekblue'
          | 'purple';
      };
    } = {},
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const titleStr = title ?? columnInfo?.config?.info?.name ?? key;
    return {
      key,
      title: titleStr,
      dataIndex: key,
      sorter: true,
      // ...generateSearchColumnProps(key, opts.searchType),
      render: nullProtectRender((record) => {
        const value = extractValue(record, opts.transformer);
        return (
          <WithDebugInfo info={{ key, title, record, value }}>
            <Tag color={_.get(opts, `colorMap['${record}']`)}>{value}</Tag>
          </WithDebugInfo>
        );
      }),
    };
  },
  generateCalendar: async (
    key,
    { model, title }: ModelOpts,
    opts: CommonColumnOpts = {},
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const titleStr = title ?? columnInfo?.config?.info?.name ?? key;
    return {
      key: castModelKey(key),
      title: titleStr,
      dataIndex: castModelKey(key),
      sorter: true,
      render: nullProtectRender((record) => {
        const value = extractValue(record, opts.transformer);
        if (value) {
          const content = moment(record).calendar();
          return (
            <Tooltip title={value}>
              <React.Fragment>
                {content}
                <div>{moment(record).fromNow()}</div>
              </React.Fragment>
            </Tooltip>
          );
        }
        return record;
      }),
    };
  },
};

export const asunaColumnHelper = {
  profile: columnHelper.fpGenerateRelation('profile.username', 'UserProfile', {
    filterType: 'search',
    relationSearchField: 'username',
    render: (content, record) =>
      record &&
      ComponentsHelper.renderDrawerButton({
        future: Promise.resolve(record),
        getModel: (data) => data,
        getPortrait: (info) => info?.portrait ?? info?.miniAppUserInfo?.avatar,
        getTitle: (info) => info.id,
        getText: (info) => `${info.email ? `${info.email}/` : ''}${info.username}`,
        modelName: 'user__profiles',
      }),
  }),
};
