/** @jsxRuntime classic */

/** @jsx jsx */
import { LinkOutlined, SearchOutlined } from '@ant-design/icons';
// noinspection ES6UnusedImports
import { jsx } from '@emotion/react';

import { PreviewButton } from '@danielwii/asuna-components';
import { WithFuture } from '@danielwii/asuna-components/dist/helper/helper';

import { Badge, Button, Checkbox, Divider, Input, Modal, Popconfirm, Space, Statistic, Tag, Tooltip } from 'antd';
import { Promise } from 'bluebird';
import * as deepDiff from 'deep-diff';
import * as _ from 'lodash';
import moment from 'moment';
import * as R from 'ramda';
import * as React from 'react';
import NumberFormat from 'react-number-format';
import * as util from 'util';

import { modelProxyCaller } from '../adapters';
import { AssetsPreview, Content, DynamicFormTypes, parseAddressStr } from '../components';
import { VideoPlayer } from '../components/DynamicForm/Videos';
import { Config } from '../config';
import { AppContext } from '../core';
import { valueToArrays } from '../core/url-rewriter';
import { ComponentsHelper, RelationColumnProps } from '../helpers';
import { createLogger } from '../logger';
import { SchemaHelper } from '../schema';
import { Asuna } from '../types';
import { castModelKey } from './cast';
import { WithDebugInfo } from './debug';
import { extractValue, removePreAndSuf } from './func';

import type { ColumnProps, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { Diff } from 'deep-diff';
import type { VideoJsPlayerOptions } from 'video.js';

const logger = createLogger('helpers');

export * from './cast';
export * from './components';
export * from './debug';
export * from './error';
export * from './func';
export * from './hooks';
export * from './interfaces';
export * from './message-box';
export * from './models';
export * from './register';
export * from './tenant';

/**
 * used by services
 * @param token
 */
export const authHeader = (token?) => {
  const authToken = token || AppContext.fromStore('auth').token;
  const schema = Config.get('AUTH_HEADER');
  if (schema === 'AuthHeaderAsBearerToken') {
    return { headers: { Authorization: `Bearer ${authToken}` } };
  }
  return { headers: { Authorization: `${schema} ${authToken}` } };
};

export const nullProtectRender = (fn: (value, record) => React.ReactChild) => (value, record): React.ReactChild => {
  return record ? fn(value, record) : 'n/a';
};

type ConditionType = 'like' | 'boolean' | 'list';
type SwitchConditionExtras = { model: string; relationSearchField?: string };

async function generateSearchColumnProps(
  dataIndex: string,
  onSearch: (data: { searchText: string; searchedColumn: string }) => void,
  conditionType?: ConditionType,
  conditionExtras?: SwitchConditionExtras,
): Promise<ColumnProps<any>> {
  // console.log('generateSearchColumnProps', { dataIndex, conditionType, conditionExtras });
  // only called in filterDropdown
  const getSelectedValue = (value) => {
    switch (conditionType) {
      case 'like':
        return [{ $like: `%${value}%` }];
      // case 'boolean':
      //   return [{ $eq: value === 'true' }];
      default:
        return [value];
    }
  };
  const getSelectedKey = (selectedKeys) => {
    if (_.get(selectedKeys, '[0]')) {
      switch (conditionType) {
        case 'like':
          return removePreAndSuf(selectedKeys[0].$like, '%', '%');
        default:
          return selectedKeys[0];
      }
    }
    return undefined;
  };

  if (conditionType === 'boolean') {
    return {
      filterMultiple: false,
      filters: [
        { text: 'True / Y', value: JSON.stringify({ $eq: true }) },
        { text: 'False / N', value: JSON.stringify({ $or: [{ $eq: false }, { $isNull: true }] }) },
      ],
    };
  }

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    onSearch({ searchText: selectedKeys[0], searchedColumn: dataIndex });
  };

  if (conditionType === 'list' && conditionExtras) {
    const items = await modelProxyCaller()
      .uniq(conditionExtras.model, dataIndex)
      .catch((reason) => logger.error('generateSearchColumnProps', reason));
    if (items) {
      return {
        filterMultiple: false,
        filters: _.map(items, (item) => ({ text: item, value: item })),
      };
    }
  }

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <Content>
        <Input
          addonBefore={conditionType}
          placeholder={`搜索 '${dataIndex}' ...`}
          value={getSelectedKey(selectedKeys)}
          onChange={(e) => setSelectedKeys(e.target.value ? getSelectedValue(e.target.value) : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
        />
        <Divider type="horizontal" style={{ margin: '0.2rem 0' }} />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
          >
            搜索
          </Button>
          <Button onClick={clearFilters} size="small">
            重置
          </Button>
        </Space>
      </Content>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : 'inherit' }} />,
  };
}

type ModelOpts = { model: string; title?: string; ctx: Asuna.Schema.TableContext };
type TextColumnOpts = {
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
};
type CommonColumnOpts = { transformer? };

export const columnCreator: (
  modelOpts: { model: string; title?: string },
  columnOpts?: TextColumnOpts,
) => Asuna.Schema.ColumnPropsCreator = (modelOpts, columnOpts) => (key, actions, { ctx }) =>
  columnHelper2.generate(key, { ...modelOpts, ctx }, columnOpts);

export const fpColumnCreator = (title?: string, columnOpts?: TextColumnOpts) => (model: string) =>
  columnCreator({ model, title }, columnOpts);

export const columnHelper2 = {
  generate: async (
    key: string,
    { model, title, ctx }: ModelOpts,
    opts: TextColumnOpts = {},
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
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
      render: (content, record) => <PreviewButton.PdfButton pdf={content} />,
    }),
  generateLang: async (key, modelOpts: ModelOpts, opts: TextColumnOpts = {}): Promise<ColumnProps<any>> =>
    columnHelper2.generate(key, modelOpts, {
      ...opts,
      render: (content, record) => {
        if (content === 'cn') {
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
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
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
    opts: { transformer?; searchType?: ConditionType; type: 'badge' | 'statistics' | 'number' } = { type: 'number' },
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
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
              count={+value}
              overflowCount={Number.MAX_SAFE_INTEGER}
              style={{ backgroundColor: '#52c41a' }}
            />
          );
        } else if (opts.type === 'number') {
          const value = extractValue(record, opts.transformer);
          return <NumberFormat value={value} displayType="text" thousandSeparator />;
        } else {
          return <Statistic value={+value} />;
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
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
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
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
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
  fpGenerateSwitch: (key, opts: ModelOpts, extras: Asuna.Schema.RecordRenderExtras) =>
    _.curry(columnHelper.generateSwitch)(key, opts, extras),
};

export const columnHelper = {
  generateID: ({ ctx }: Asuna.Schema.RecordRenderExtras) => async (
    key = 'id',
    title = 'ID',
    transformer?,
  ): Promise<ColumnProps<any>> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...(await generateSearchColumnProps(key, ctx.onSearch, 'like')),
    render: nullProtectRender((record) => (
      <WithDebugInfo info={{ key, title, record }}>{transformer ? transformer(record) : record}</WithDebugInfo>
    )),
  }),
  fpGenerateSubRelation: <RelationSchema extends any = object>(
    key: string,
    title: string,
    opts: {
      ref?: string;
      subRef: string;
      transformer: keyof RelationSchema;
      render?: (content, record?, extras?: Asuna.Schema.RecordRenderExtras) => React.ReactNode;
    },
  ) => async (
    laterKey: string,
    actions: Asuna.Schema.RecordRenderActions,
    extras: Asuna.Schema.RecordRenderExtras,
  ): Promise<RelationColumnProps> => {
    let ref, transformer;
    if (!opts.ref && !opts.transformer) {
      [ref, transformer] = key.split('.');
    }

    ref = ref || opts.ref || key;
    transformer = transformer || opts.transformer;

    return {
      key,
      title,
      relation: ref,
      dataIndex: ref,
      // ...filterProps,
      render: nullProtectRender((record) => {
        return (
          <div style={record?.isPublished == false || record?.isActive == false ? { color: 'darkred' } : {}}>
            {record?.id ? (
              <WithFuture
                future={() =>
                  modelProxyCaller().batchFetch(opts.subRef, { id: record.id, relations: [opts.transformer as string] })
                }
              >
                {(data) => (
                  <WithDebugInfo info={{ key, title, opts, record, transformer }}>
                    {opts.render
                      ? opts.render(extractValue(data, transformer), data, extras)
                      : extractValue(data, transformer)}
                  </WithDebugInfo>
                )}
              </WithFuture>
            ) : (
              'n/a'
            )}
          </div>
        );
      }),
    };
  },
  fpGenerateRelation: <RelationSchema extends any = object>(
    key: string,
    title: string,
    opts: {
      ref?: string;
      transformer?: keyof RelationSchema | ((record) => React.ReactChild);
      filterType?: 'list' | 'search';
      relationSearchField?: string;
      render?: (content, record?, extras?: Asuna.Schema.RecordRenderExtras) => React.ReactNode;
    },
  ) => async (
    laterKey: string,
    actions: Asuna.Schema.RecordRenderActions,
    extras: Asuna.Schema.RecordRenderExtras,
  ): Promise<RelationColumnProps> => {
    let ref, transformer;
    if (!opts.ref && !opts.transformer) {
      [ref, transformer] = key.split('.');
    }

    ref = ref || opts.ref || key;
    transformer = transformer || opts.transformer;
    let filterProps: ColumnType<string> = {};
    switch (opts.filterType) {
      case 'list':
        const modelName = extras.modelName;
        const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
        const relation = AppContext.adapters.models.getFormSchema(modelName)[ref];
        const relationName = relation?.options?.selectable;
        if (relationName) {
          const field = opts.relationSearchField || 'name';
          const {
            data: { items },
          } = await AppContext.adapters.models.loadModels(relationName, {
            fields: [field],
            pagination: { pageSize: 500 },
          });
          filterProps = {
            filterMultiple: false,
            // 关联筛选时的搜索 key 为了区别同一个关联的不同字段，所以会包含非主键信息，这里传递整个包括主键的搜索信息
            filters: _.map(items, (item) => ({
              text: `${item[primaryKey]} / ${item[field]}`,
              value: JSON.stringify({ key: [`${ref}.${primaryKey}`], value: [item[primaryKey]] }),
            })),
          };
        }
        break;
      case 'search':
        filterProps = await generateSearchColumnProps(
          `${ref}.${opts.relationSearchField || 'name'}`,
          extras.ctx.onSearch,
          'like',
        );
        break;
    }

    return {
      key: key as string,
      title,
      relation: ref,
      dataIndex: ref,
      ...filterProps,
      render: nullProtectRender((record) => {
        const content = extractValue(record, transformer);
        return (
          <WithDebugInfo info={{ key, title, opts, record, content, transformer }}>
            <div style={record?.isPublished == false || record?.isActive == false ? { color: 'darkred' } : {}}>
              {opts.render ? opts.render(content, record, extras) : content}
            </div>
          </WithDebugInfo>
        );
      }),
    };
  },
  generateLink: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender((record) => {
      const renderLink = (value) => {
        // const value = extractValue(v, opts.transformer);
        if (typeof value === 'string' && value.length > 30) {
          return (
            <WithDebugInfo info={{ value }}>
              <Tooltip title={value}>
                <Button href={value} size="small" type="dashed" target="_blank">
                  {`${value.slice(0, 30)}...`}
                  <LinkOutlined />
                </Button>
              </Tooltip>
              {/* language=CSS */}
              <style jsx>{`
                /* 用于修复 tooltip 最大宽度固定以致长文本显示异常的问题 */
                :global(.ant-tooltip-inner) {
                  max-width: inherit;
                }
              `}</style>
            </WithDebugInfo>
          );
        }
        return (
          <WithDebugInfo info={{ value }}>
            <Button href={value} size="small" type="dashed" target="_blank">
              {value}
              <LinkOutlined />
            </Button>
          </WithDebugInfo>
        );
      };

      if (_.isArray(record)) {
        return (
          <React.Fragment>
            {record.map((v) => (
              <div key={v}>{renderLink(v)}</div>
            ))}
          </React.Fragment>
        );
      }
      return renderLink(record);
    }),
  }),
  generateCalendar: (key, title, transformer?): ColumnProps<any> => ({
    key: castModelKey(key),
    title,
    dataIndex: castModelKey(key),
    sorter: true,
    render: nullProtectRender((record) => {
      const value = extractValue(record, transformer);
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
  }),
  /**
   * 生成动作按钮
   * @param actions 最终的渲染函数
   * @returns {{key: string, title: string, render: function(*=, *=): *}}
   */
  generateActions: (actions): ColumnProps<any> => ({
    key: 'action',
    title: 'Action',
    render: actions,
  }),
  /**
   * 生成预览小图
   * @deprecated {@see columnHelper2.generate}
   */
  generateImage: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
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
  }),
  generateVideo: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender((record) => {
      const value = extractValue(record, opts.transformer);
      if (value) {
        const videoJsOptions: VideoJsPlayerOptions = {
          width: '100%' as any,
          height: 160,
          autoplay: false,
          controls: true,
          sources: [{ src: value /*type: 'video/mp4',*/ }],
        };
        return (
          <React.Fragment>
            <VideoPlayer key={key} {...videoJsOptions} />
            <TooltipContent value={value} link />
          </React.Fragment>
        );
      }
      return record;
    }),
  }),
  /**
   * 生成切换按钮
   */
  generateSwitch: async (
    key,
    { model, title, ctx }: ModelOpts,
    extras: Asuna.Schema.RecordRenderExtras,
  ): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
    return {
      title: title ?? columnInfo?.config?.info?.name ?? key,
      dataIndex: castModelKey(key),
      key: castModelKey(key),
      ...(await generateSearchColumnProps(castModelKey(key), ctx.onSearch, 'boolean')),
      render: (isActive, record) => {
        const primaryKey = AppContext.adapters.models.getPrimaryKey(extras.modelName);
        const id = _.get(record, primaryKey);
        const component = extras.readonly ? (
          <Checkbox checked={isActive} disabled={true} />
        ) : (
          <Popconfirm
            title={isActive ? `是否注销: ${id}` : `是否激活: ${id}`}
            onConfirm={async () => {
              // const { modelProxy } = require('../adapters');
              await AppContext.adapters.models.upsert(extras.modelName, { body: { id, [key]: !isActive } });
              extras.callRefresh();
            }}
          >
            <Checkbox checked={isActive} />
          </Popconfirm>
        );
        return extras.tips ? <Tooltip title={extras.tips}>{component}</Tooltip> : component;
      },
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

/**
 * 通用配置
 */
export const commonColumns = {
  // any: (key, title?) => columnHelper.generate(key, title || key.toUpperCase()),
  primaryKey: (key, title, extras: Asuna.Schema.RecordRenderExtras) => columnHelper.generateID(extras)(key, title),
  primaryKeyByExtra: (extras: Asuna.Schema.RecordRenderExtras) => {
    const primaryKey = AppContext.adapters.models.getPrimaryKey(_.get(extras, 'modelName'));
    return columnHelper.generateID(extras)(primaryKey, primaryKey.toUpperCase());
  },
  id: (extras: Asuna.Schema.RecordRenderExtras) => columnHelper.generateID(extras)(),
  fpName: fpColumnCreator('名称', { searchType: 'like' }),
  fpOrdinal: fpColumnCreator('序号'),
  fpDescription: fpColumnCreator('描述', { searchType: 'like' }),
  fpTitle: fpColumnCreator('Title', { searchType: 'like' }),
  fpNameCn: fpColumnCreator('中文名称', { searchType: 'like' }),
  fpNameEn: fpColumnCreator('英文名称', { searchType: 'like' }),
  fpEmail: fpColumnCreator('Email', { searchType: 'like' }),
  fpType: fpColumnCreator('类型'),
  // fpLang: fpColumnCreator('语言', { searchType: 'list' }),
  fpCategory: (model) =>
    columnHelper.fpGenerateRelation('category', '分类', { transformer: 'name', filterType: 'list' }),
  fpEduType: fpColumnCreator('类型'),
  fpUpdatedBy: fpColumnCreator('Updated By', { searchType: 'list' }),
  createdAt: columnHelper.generateCalendar('createdAt', '创建时间'),
  updatedAt: columnHelper.generateCalendar('updatedAt', '更新时间'),
  isPublished: (model: string, extras: Asuna.Schema.RecordRenderExtras) =>
    columnHelper2.fpGenerateSwitch('isPublished', { model, title: '发布', ctx: extras.ctx }, extras),
  actions: columnHelper.generateActions,
};

export const defaultColumns = (actions) => [commonColumns.id, commonColumns.updatedAt, commonColumns.actions(actions)];

export const defaultColumnsByPrimaryKey = (primaryKey = 'id') => (actions, extras) => [
  commonColumns.primaryKey(primaryKey, primaryKey.toUpperCase(), extras),
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const diff = (
  first,
  second,
  opts: { include?; exclude? } = {},
): { verbose: Array<Diff<any>>; isDifferent: boolean } => {
  let verbose;
  if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.include))) {
    verbose = deepDiff.diff(R.pickAll(opts.include)(first), R.pickAll(opts.include)(second));
  } else if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.exclude))) {
    verbose = deepDiff.diff(R.omit(opts.exclude)(first), R.omit(opts.exclude)(second));
  } else {
    verbose = deepDiff.diff(first, second);
  }
  return { verbose, isDifferent: !!verbose };
};

export const isJson = (value): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

export function TooltipContent({ value, link }: { value: any; link?: boolean }) {
  let component = _.isObject(value) ? util.inspect(value) : value;
  const length = 30;
  if (typeof value === 'string' && value.length > length) {
    const shortValue = `${value.slice(0, length)}...`;
    if (link) {
      return <TextLink url={value} text={shortValue} />;
    }
    component = (
      <Tooltip title={value}>
        <div style={{ maxWidth: '15rem' }}>{shortValue}</div>
      </Tooltip>
    );
    return <React.Fragment>{component}</React.Fragment>;
  }
  return link ? <TextLink url={component} text={component} /> : <React.Fragment>{component}</React.Fragment>;
}

function TextLink({ url, text }: { url: string; text?: string }) {
  return (
    <a href={url} target={'_blank'}>
      {text || url}
    </a>
  );
}

export type ParseType =
  // TODO move to shared types
  | 'ActivityStatus'
  | 'ApplyStatus'
  | 'ApplyStatusAction'
  | 'EnrollmentStatus'
  | 'EnrollmentStatusAction'
  | 'Experience'
  | 'InteractionType'
  // Common Types
  | 'Degree'
  | 'Sex';

export function parseType(key: ParseType, name: string | null): string {
  if (!name) return '';
  const value = AppContext.constants?.[key]?.[name];
  if (!value) {
    console.warn('not found for constants', { key, name, map: AppContext.constants?.[key] });
  }
  return value ?? name;
}

type Defer<R> = {
  resolve: (thenableOrResult?: Promise<R>) => void;
  reject: (error?: any) => void;
  onCancel?: (callback: () => void) => void;
  promise: Promise<R>;
};

function defer<R>(): Defer<R> {
  let resolve, reject, onCancel;
  const promise = new Promise(function () {
    resolve = arguments[0];
    reject = arguments[1];
    onCancel = arguments[2];
  });
  return { resolve, reject, onCancel, promise };
}

export class BatchLoader<T, R> {
  private queue: T[] = [];
  private runner: Promise<R> | null;

  constructor(
    private readonly batchLoaderFn: (keys: T[]) => Promise<R>,
    private readonly options?: {
      extractor?: (data: R, key: T) => any;
    },
  ) {}

  load(key: T): Promise<any> {
    this.queue.push(key);
    const runner =
      this.runner ||
      (this.runner = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.runner = null;
          const { queue } = this;
          this.queue = [];
          this.batchLoaderFn(queue).then(resolve, reject);
        }, 0);
      }));

    return new Promise((resolve, reject) =>
      runner.then((data) => resolve(this.options?.extractor ? this.options.extractor(data, key) : data), reject),
    );
  }
}
