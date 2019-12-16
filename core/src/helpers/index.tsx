import { AssetsPreview, Content } from '@asuna-admin/components';
import { VideoPlayer } from '@asuna-admin/components/DynamicForm/Videos';
import { Config } from '@asuna-admin/config';
import { AppContext } from '@asuna-admin/core';
import { valueToArrays } from '@asuna-admin/core/url-rewriter';
import { RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Badge, Button, Checkbox, Divider, Icon, Input, Popconfirm, Statistic, Tag, Tooltip } from 'antd';
import { ColumnProps } from 'antd/es/table';
import { FilterDropdownProps } from 'antd/es/table/interface';
import * as deepDiff from 'deep-diff';
import * as _ from 'lodash';
import moment from 'moment';
import * as R from 'ramda';
import * as React from 'react';
import * as util from 'util';
import { VideoJsPlayerOptions } from 'video.js';

import { castModelKey } from './cast';
import { WithDebugInfo } from './debug';
import { extractValue, removePreAndSuf } from './func';

const logger = createLogger('helpers');

export * from './cast';
export * from './components';
export * from './error';
export * from './func';
export * from './hooks';
export * from './interfaces';
export * from './message-box';
export * from './models';
export * from './register';

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

export const nullProtectRender = (fn: (record) => React.ReactChild) => (record): React.ReactChild => {
  return record ? fn(record) : 'n/a';
};

type ConditionType = 'like' | 'boolean';
type SwitchConditionExtras = {};

function generateSearchColumnProps(
  dataIndex: string,
  conditionType?: ConditionType,
  conditionExtras?: SwitchConditionExtras,
): ColumnProps<any> {
  // only called in filterDropdown
  const getSelectedValue = value => {
    switch (conditionType) {
      case 'like':
        return [{ $like: `%${value}%` }];
      // case 'boolean':
      //   return [{ $eq: value === 'true' }];
      default:
        return [value];
    }
  };
  const getSelectedKey = selectedKeys => {
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

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <Content>
        <Input
          addonBefore={conditionType}
          placeholder={`Search '${dataIndex}' ...`}
          value={getSelectedKey(selectedKeys)}
          onChange={e => setSelectedKeys && setSelectedKeys(e.target.value ? getSelectedValue(e.target.value) : [])}
          onPressEnter={confirm}
        />
        <Divider type="horizontal" style={{ margin: '0.2rem 0' }} />
        <Button type="primary" onClick={confirm} icon="search" size="small">
          Search
        </Button>{' '}
        <Button onClick={clearFilters} size="small">
          Reset
        </Button>
      </Content>
    ),
    filterIcon: filtered => <Icon type="search" style={{ color: filtered ? '#1890ff' : 'inherit' }} />,
  };
}

export const columnHelper = {
  generateOriginal: (key, title, transformer?): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender(record => (transformer ? transformer(record) : record)),
  }),
  generateID: (key = 'id', title = 'ID', transformer?): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...generateSearchColumnProps(key, 'like'),
    render: nullProtectRender(record => (
      <WithDebugInfo info={{ key, title, record }}>{transformer ? transformer(record) : record}</WithDebugInfo>
    )),
  }),
  fpGenerateRelation: <RelationSchema extends any = object>(
    key: string,
    title: string,
    opts: {
      ref?: string;
      transformer?: keyof RelationSchema | ((record) => React.ReactChild);
      filterType?: 'list' | 'search';
      relationSearchField?: string;
      render?: (content, record?) => React.ReactChild;
    } = {},
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
    let filterProps = {};
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
            filters: _.map(items, item => ({
              text: `${item[primaryKey]} / ${item[field]}`,
              value: JSON.stringify({ key: [`${ref}.${primaryKey}`], value: [item[primaryKey]] }),
            })),
          };
        }
        break;
      case 'search':
        filterProps = generateSearchColumnProps(`${ref}.${opts.relationSearchField || 'name'}`, 'like');
        break;
    }

    return {
      key: key as string,
      title,
      relation: ref,
      dataIndex: ref,
      ...filterProps,
      render: nullProtectRender(record => {
        const content = extractValue(record, transformer);
        return (
          <WithDebugInfo info={{ key, title, opts, record, content, transformer }}>
            {opts.render ? opts.render(content, record) : content}
          </WithDebugInfo>
        );
      }),
    };
  },
  /**
   * @deprecated {@see generateRelationFp}
   * @param key
   * @param title
   * @param opts
   */
  generateRelation: async function<EntitySchema = object, RelationSchema = object>(
    key: string,
    title,
    opts: {
      ref?: keyof EntitySchema;
      transformer?;
      filterType?:
        | 'list'
        /**
         * @deprecated not implemented
         */
        | 'search';
      relationField?: string;
      actions;
      extras;
    },
  ): Promise<RelationColumnProps> {
    const ref = (opts.ref || key) as string;
    let filterProps = {};
    switch (opts.filterType) {
      case 'list':
        const modelName = opts?.extras?.modelName;
        const relation = AppContext.adapters.models.getFormSchema(modelName)[ref];
        const relationName = relation?.options?.selectable;
        if (relationName) {
          const field = opts.relationField || 'name';
          const {
            data: { items },
          } = await AppContext.adapters.models.loadModels(relationName, {
            fields: [field],
            pagination: { pageSize: 500 },
          });
          filterProps = {
            filterMultiple: false,
            filters: _.map(items, item => ({ text: item[field], value: item['id'] })),
          };
        }
        break;
      case 'search':
        // fixme not implemented
        filterProps = generateSearchColumnProps(`${ref}.${opts.relationField || 'name'}`, 'like');
        break;
    }

    return {
      key: key as string,
      title,
      relation: ref,
      dataIndex: ref,
      ...filterProps,
      render: nullProtectRender(record => {
        const content = extractValue(record, opts.transformer)[opts.transformer];
        return <WithDebugInfo info={{ key, title, opts, record }}>{content}</WithDebugInfo>;
      }),
    };
  },
  generate: (
    key,
    title,
    opts: {
      transformer?: ((record) => string) | string;
      searchType?: ConditionType;
      render?: (content, record?) => React.ReactChild;
    } = {},
  ): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...generateSearchColumnProps(key, opts.searchType),
    render: nullProtectRender(record => {
      const content = extractValue(record, opts.transformer);
      return (
        <WithDebugInfo info={{ key, title, record }}>
          {opts.render ? opts.render(content, record) : <TooltipContent value={content} />}
        </WithDebugInfo>
      );
    }),
  }),
  generateTag: (
    key,
    title,
    opts: {
      transformer?;
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
  ): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    // ...generateSearchColumnProps(key, opts.searchType),
    render: nullProtectRender(record => {
      const value = extractValue(record, opts.transformer);
      return (
        <WithDebugInfo info={{ key, title, record }}>
          <Tag color={_.get(opts, `colorMap['${value}']`)}>{value}</Tag>
        </WithDebugInfo>
      );
    }),
  }),
  generateNumber: (
    key,
    title,
    opts: { transformer?; searchType?: ConditionType; type: 'badge' | 'statistics' } = {
      type: 'badge',
    },
  ): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...generateSearchColumnProps(key, opts.searchType),
    render: nullProtectRender(record => {
      const value = extractValue(record, opts.transformer);
      return opts.type === 'badge' ? (
        <Badge count={+value} overflowCount={Number.MAX_SAFE_INTEGER} style={{ backgroundColor: '#52c41a' }} />
      ) : (
        <Statistic value={+value} />
      );
    }),
  }),
  generateLink: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender(record => {
      const value = extractValue(record, opts.transformer);
      if (typeof value === 'string' && value.length > 30) {
        return (
          <React.Fragment>
            <Tooltip title={value}>
              <Button href={value} size="small" type="dashed" target="_blank">
                {`${value.slice(0, 30)}...`}
                <Icon type="link" />
              </Button>
            </Tooltip>
            {/* language=CSS */}
            <style jsx>{`
              /* 用于修复 tooltip 最大宽度固定以致长文本显示异常的问题 */
              :global(.ant-tooltip-inner) {
                max-width: inherit;
              }
            `}</style>
          </React.Fragment>
        );
      }
      return (
        <Button href={value} size="small" type="dashed" target="_blank">
          {value}
          <Icon type="link" />
        </Button>
      );
    }),
  }),
  generateCalendar: (key, title, transformer?): ColumnProps<any> => ({
    key: castModelKey(key),
    title,
    dataIndex: castModelKey(key),
    sorter: true,
    render: nullProtectRender(record => {
      const value = extractValue(record, transformer);
      if (value) {
        const content = moment(record).calendar();
        return (
          <Tooltip title={value}>
            {content}
            <div>{moment(record).fromNow()}</div>
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
   * TODO feat 增加预览大图功能
   * @param key
   * @param title
   * @param opts
   */
  generateImage: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender(record => {
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
    render: nullProtectRender(record => {
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
          <>
            <VideoPlayer key={key} {...videoJsOptions} />
            <TooltipContent value={value} link />
          </>
        );
      }
      return record;
    }),
  }),
  /**
   * 生成切换按钮
   * @param key
   * @param title
   * @param {any} readonly
   * @param {any} modelName
   * @param {any} callRefresh
   * @returns {{title: any; dataIndex: string | any; key: string | any; render: (isActive, record) => any}}
   */
  generateSwitch: (
    key,
    title,
    { readonly, modelName, callRefresh }: { readonly?; modelName?; callRefresh? },
  ): ColumnProps<any> => ({
    title,
    dataIndex: castModelKey(key),
    key: castModelKey(key),
    ...generateSearchColumnProps(castModelKey(key), 'boolean', {}),
    render: function(isActive, record) {
      return readonly ? (
        <Checkbox checked={isActive} disabled={true} />
      ) : (
        <Popconfirm
          title={isActive ? `是否注销: ${record.id}` : `是否激活: ${record.id}`}
          onConfirm={async () => {
            // const { modelProxy } = require('../adapters');
            await AppContext.adapters.models.upsert(modelName, {
              body: {
                id: record.id,
                [key]: !isActive,
              },
            });
            callRefresh();
          }}
        >
          <Checkbox checked={isActive} />
        </Popconfirm>
      );
    },
  }),
};

/**
 * 通用配置
 */
export const commonColumns = {
  any: (key, title?) => columnHelper.generate(key, title || key.toUpperCase()),
  primaryKey: (key, title) => columnHelper.generateID(key, title),
  primaryKeyByExtra: (extras: Asuna.Schema.RecordRenderExtras) => {
    const primaryKey = AppContext.adapters.models.getPrimaryKey(_.get(extras, 'modelName'));
    return columnHelper.generateID(primaryKey, primaryKey.toUpperCase());
  },
  id: columnHelper.generateID(),
  name: columnHelper.generate('name', '名称', { searchType: 'like' }),
  ordinal: columnHelper.generate('ordinal', '序号'),
  description: columnHelper.generate('description', '描述', { searchType: 'like' }),
  title: columnHelper.generate('title', 'Title', { searchType: 'like' }),
  nameCn: columnHelper.generate('nameCn', '中文名称', { searchType: 'like' }),
  nameEn: columnHelper.generate('nameEn', '英文名称', { searchType: 'like' }),
  email: columnHelper.generate('email', 'Email', { searchType: 'like' }),
  type: columnHelper.generate('type', '类型'),
  eduType: columnHelper.generate('eduType', '类型'),
  createdAt: columnHelper.generateCalendar('createdAt', '创建时间'),
  updatedAt: columnHelper.generateCalendar('updatedAt', '更新时间'),
  isPublished: _.curry(columnHelper.generateSwitch)('isPublished', '发布'),
  actions: columnHelper.generateActions,
};

export const defaultColumns = actions => [commonColumns.id, commonColumns.updatedAt, commonColumns.actions(actions)];

export const defaultColumnsByPrimaryKey = (primaryKey = 'id') => actions => [
  commonColumns.primaryKey(primaryKey, primaryKey.toUpperCase()),
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const diff = (first, second, opts: { include?; exclude? } = {}) => {
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

function TooltipContent({ value, link }: { value: any; link?: boolean }) {
  let component = _.isObject(value) ? util.inspect(value) : value;
  if (typeof value === 'string' && value.length > 20) {
    const shortValue = `${value.slice(0, 20)}...`;
    if (link) {
      return <TextLink url={value} text={shortValue} />;
    }
    component = <Tooltip title={value}>{shortValue}</Tooltip>;
    return component;
  }
  return link ? <TextLink url={component} text={component} /> : component;
}

function TextLink({ url, text }: { url: string; text?: string }) {
  return (
    <a href={url} target={'_blank'}>
      {text || url}
    </a>
  );
}
