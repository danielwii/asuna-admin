import { AssetsPreview } from '@asuna-admin/components';
import { VideoPlayer } from '@asuna-admin/components/DynamicForm/Videos';
import { Config } from '@asuna-admin/config';
import { AppContext } from '@asuna-admin/core';
import { valueToArrays } from '@asuna-admin/core/url-rewriter';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { Badge, Button, Checkbox, Icon, Input, Popconfirm, Statistic, Tag, Tooltip } from 'antd';
import { ColumnProps } from 'antd/es/table';
import * as deepDiff from 'deep-diff';
import idx from 'idx';
import _ from 'lodash';
import moment from 'moment';
import * as R from 'ramda';
import React from 'react';

import { castModelKey } from './cast';
import { WithDebugInfo } from './debug';
import { removePreAndSuf } from './func';

const logger = createLogger('helpers');

export * from './cast';
export * from './components';
export * from './error';
export * from './func';
export * from './message-box';
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
    if (selectedKeys[0]) {
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
        { text: 'True', value: JSON.stringify({ $eq: true }) },
        { text: 'False', value: JSON.stringify({ $or: [{ $eq: false }, { $isNull: true }] }) },
      ],
    };
  }

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div>
        <Input
          addonBefore={conditionType}
          placeholder={`Search ${dataIndex}`}
          value={getSelectedKey(selectedKeys)}
          onChange={e => setSelectedKeys(e.target.value ? getSelectedValue(e.target.value) : [])}
          onPressEnter={confirm}
        />
        <Button type="primary" onClick={confirm} icon="search" size="small">
          Search
        </Button>
        <Button onClick={clearFilters} size="small">
          Reset
        </Button>
      </div>
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
    render: text => (transformer ? transformer(text) : text),
  }),
  generateID: (key = 'id', title = 'ID', transformer?): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => (transformer ? transformer(text) : text),
  }),
  fpGenerateRelation: <RelationSchema extends any = object>(
    key: string,
    title: string,
    opts: {
      ref?: string;
      transformer?: keyof RelationSchema | ((record) => React.ReactChild);
      filterType?:
        | 'list'
        /** FIXME not implemented */
        | 'search';
      relationField?: string;
      render?: (content) => React.ReactChild;
    } = {},
  ) => async (
    laterKey: string,
    actions: Asuna.Schema.RecordRenderActions,
    extras: Asuna.Schema.RecordRenderExtras,
  ): Promise<ColumnProps<any> & { relation: any }> => {
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
        const relation = AppContext.adapters.models.getFormSchema(modelName)[ref];
        const relationName = idx(relation, _ => _.options.selectable) as any;
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
      render: text => {
        const content = _.isFunction(transformer) ? transformer(text) : text[transformer];
        return (
          <WithDebugInfo info={{ key, title, opts, text }}>
            {opts.render ? opts.render(content) : content}
          </WithDebugInfo>
        );
      },
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
  ): Promise<ColumnProps<any> & { relation: any }> {
    const ref = (opts.ref || key) as string;
    let filterProps = {};
    switch (opts.filterType) {
      case 'list':
        const modelName = idx(opts, _ => _.extras.modelName) as any;
        const relation = AppContext.adapters.models.getFormSchema(modelName)[ref];
        const relationName = idx(relation, _ => _.options.selectable) as any;
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
      render: text => {
        const content = opts.transformer ? opts.transformer(text) : text;
        return <WithDebugInfo info={{ key, title, opts, text }}>{content}</WithDebugInfo>;
      },
    };
  },
  generate: (key, title, opts: { transformer?; searchType?: ConditionType } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...generateSearchColumnProps(key, opts.searchType),
    render: text => {
      const value = opts.transformer ? opts.transformer(text) : text;
      let component = value;
      if (typeof value === 'string' && value.length > 20) {
        component = <Tooltip title={value}>{`${value.slice(0, 20)}...`}</Tooltip>;
      }
      return <WithDebugInfo info={{ key, title, text }}>{component}</WithDebugInfo>;
    },
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
    render: text => {
      const value = opts.transformer ? opts.transformer(text) : text;
      return (
        <WithDebugInfo info={{ key, title, text }}>
          <Tag color={_.get(opts, `colorMap['${value}']`)}>{value}</Tag>
        </WithDebugInfo>
      );
    },
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
    render: text => {
      const value = opts.transformer ? opts.transformer(text) : text;
      return opts.type === 'badge' ? (
        <Badge count={+value} overflowCount={Number.MAX_SAFE_INTEGER} style={{ backgroundColor: '#52c41a' }} />
      ) : (
        <Statistic value={+value} />
      );
    },
  }),
  generateLink: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      if (text) {
        const value = opts.transformer ? opts.transformer(text) : text;
        if (typeof value === 'string' && value.length > 30) {
          // const host = Config.get('UPLOADS_ENDPOINT');
          // const url = `${opts.host || host}${value}`;
          // const url = joinUrl(Config.get('UPLOADS_ENDPOINT'), value);
          const url = value;
          return (
            <React.Fragment>
              <Tooltip title={url}>
                <Button href={url} size="small" type="dashed" target="_blank">
                  {`${url.slice(0, 30)}...`}
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
      }
      return 'n/a';
    },
  }),
  generateCalendar: (key, title, transformer?): ColumnProps<any> => ({
    key: castModelKey(key),
    title,
    dataIndex: castModelKey(key),
    sorter: true,
    render: text => {
      if (text) {
        const value = transformer ? transformer(text) : text;
        const content = moment(text).calendar();
        return (
          <Tooltip title={value}>
            {content}
            <div>{moment(text).fromNow()}</div>
          </Tooltip>
        );
      }
      return 'n/a';
    },
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
    render: text => {
      if (text) {
        try {
          const value = opts.transformer ? opts.transformer(text) : text;
          if (value) {
            const images = valueToArrays(value);
            // const host = Config.get('UPLOADS_ENDPOINT', '');
            // return _.map(images, image => <AssetPreview key={image} host={host} url={image} />);
            return <AssetsPreview key={images} urls={images} />;
          }
        } catch (e) {
          logger.error('[generateImage]', e, { key, title, text });
          return text;
        }
      }
      return 'n/a';
    },
  }),
  generateVideo: (key, title, opts: { transformer?; host?: string } = {}): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      if (text) {
        try {
          const value = opts.transformer ? opts.transformer(text) : text;
          if (value) {
            const videoJsOptions = {
              width: '100%',
              height: 160,
              autoplay: false,
              controls: true,
              sources: [
                {
                  src: value,
                  // type: 'video/mp4',
                },
              ],
            };
            return (
              <>
                <VideoPlayer key={key} {...videoJsOptions} />
                {value}
              </>
            );
          }
        } catch (e) {
          logger.error('[generateVideo]', e, { key, title, text });
          return text;
        }
      }
      return 'n/a';
    },
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
  title: columnHelper.generate('title', '标题', { searchType: 'like' }),
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
