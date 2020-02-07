import { AssetsPreview, Content, DynamicFormTypes, parseAddressStr, PdfButton } from '@asuna-admin/components';
import { VideoPlayer } from '@asuna-admin/components/DynamicForm/Videos';
import { Config } from '@asuna-admin/config';
import { AppContext } from '@asuna-admin/core';
import { valueToArrays } from '@asuna-admin/core/url-rewriter';
import { RelationColumnProps } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { SchemaHelper } from '@asuna-admin/schema';
import { Asuna } from '@asuna-admin/types';

import { Badge, Button, Checkbox, Divider, Icon, Input, Modal, Popconfirm, Statistic, Tag, Tooltip } from 'antd';
import { ColumnProps } from 'antd/es/table';
import { FilterDropdownProps } from 'antd/es/table/interface';
import * as deepDiff from 'deep-diff';
import { Diff } from 'deep-diff';
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
  conditionType?: ConditionType,
  conditionExtras?: SwitchConditionExtras,
): Promise<ColumnProps<any>> {
  // console.log('generateSearchColumnProps', { dataIndex, conditionType, conditionExtras });
  // only called in filterDropdown
  const getSelectedValue = async value => {
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

  /*
  if (conditionType === 'list' && conditionExtras) {
    const modelName = conditionExtras?.model;
    const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
    const relation = AppContext.adapters.models.getFormSchema(modelName)[dataIndex];
    const relationName = relation?.options?.selectable ?? relation?.ref ?? relation?.name;
    console.log({ modelName, primaryKey, relation, relationName });
    if (relationName) {
      const field = conditionExtras.relationSearchField || 'name';
      const {
        data: { items },
        // TODO 取 unique 数据
      } = await AppContext.adapters.models.loadModels(relationName, {
        fields: [field],
        pagination: { pageSize: 500 },
      });
      return {
        filterMultiple: false,
        // 关联筛选时的搜索 key 为了区别同一个关联的不同字段，所以会包含非主键信息，这里传递整个包括主键的搜索信息
        filters: _.map(items, item => ({
          text: `${item[primaryKey]} / ${item[field]}`,
          value: JSON.stringify({ key: [`${dataIndex}.${primaryKey}`], value: [item[primaryKey]] }),
        })),
      };
    }

    return {};
  }
*/

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <Content>
        <Input
          addonBefore={conditionType}
          placeholder={`搜索 '${dataIndex}' ...`}
          value={getSelectedKey(selectedKeys)}
          onChange={async e =>
            setSelectedKeys && setSelectedKeys(e.target.value ? await getSelectedValue(e.target.value) : [])
          }
          onPressEnter={confirm}
        />
        <Divider type="horizontal" style={{ margin: '0.2rem 0' }} />
        <Button type="primary" onClick={confirm} icon="search" size="small">
          搜索
        </Button>{' '}
        <Button onClick={clearFilters} size="small">
          重置
        </Button>
      </Content>
    ),
    filterIcon: filtered => <Icon type="search" style={{ color: filtered ? '#1890ff' : 'inherit' }} />,
  };
}

type ModelOpts = { model: string; title?: string };
type TextColumnOpts = {
  mode?: 'html' | 'text' | 'button';
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

export const columnHelper2 = {
  generate: async (key, { model, title }: ModelOpts, opts: TextColumnOpts = {}): Promise<ColumnProps<any>> => {
    const columnInfo = model ? await SchemaHelper.getColumnInfo(model, key) : undefined;
    return {
      key,
      title: title ?? columnInfo?.config?.info?.name ?? key,
      dataIndex: key,
      sorter: true,
      ...(await generateSearchColumnProps(key, opts.searchType, { model })),
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
    columnHelper2.generate(key, modelOpts, { ...opts, render: (content, record) => <PdfButton pdf={content} /> }),
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
      render: nullProtectRender(record => {
        const value = extractValue(record, opts.transformer);
        return (
          <WithDebugInfo info={{ key, title, opts, record }}>
            {value ? <AssetsPreview key={key} urls={valueToArrays(value)} /> : record}
          </WithDebugInfo>
        );
      }),
    };
  },
  generateTag: async (
    key,
    { model, title }: ModelOpts,
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
      render: nullProtectRender(record => {
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
      render: nullProtectRender(record => {
        const value = extractValue(record, opts.transformer);
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
    };
  },
  fpGenerateSwitch: (key, title) => _.curry(columnHelper.generateSwitch)(key, title),
};
export const columnHelper = {
  generateID: async (key = 'id', title = 'ID', transformer?): Promise<ColumnProps<any>> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...(await generateSearchColumnProps(key, 'like')),
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
      render?: (content, record?, extras?: Asuna.Schema.RecordRenderExtras) => React.ReactNode;
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
        filterProps = await generateSearchColumnProps(`${ref}.${opts.relationSearchField || 'name'}`, 'like');
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
            {opts.render ? opts.render(content, record, extras) : content}
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
        filterProps = await generateSearchColumnProps(`${ref}.${opts.relationField || 'name'}`, 'like');
        break;
    }

    return {
      key: key as string,
      title,
      relation: ref,
      dataIndex: ref,
      ...filterProps,
      render: nullProtectRender(record => {
        const content = extractValue(record, opts.transformer);
        return <WithDebugInfo info={{ key, title, opts, record }}>{content}</WithDebugInfo>;
      }),
    };
  },
  /**
   * @deprecated {@see columnHelper2.generate}
   */
  generate: async (
    key,
    title,
    opts: {
      transformer?: ((record) => string) | string;
      searchType?: ConditionType;
      render?: (content, record?) => React.ReactChild;
    } = {},
  ): Promise<ColumnProps<any>> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...(await generateSearchColumnProps(key, opts.searchType)),
    render: nullProtectRender((value, record) => {
      const extracted = extractValue(value, opts.transformer);
      return (
        <WithDebugInfo info={{ key, title, value, record, extracted, opts }}>
          {opts.render ? opts.render(extracted, record) : <TooltipContent value={extracted} />}
        </WithDebugInfo>
      );
    }),
  }),
  /**
   * @deprecated {@see columnHelper2.generateTag}
   */
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
  generateNumber: async (
    key,
    title,
    opts: { transformer?; searchType?: ConditionType; type: 'badge' | 'statistics' } = {
      type: 'badge',
    },
  ): Promise<ColumnProps<any>> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    ...(await generateSearchColumnProps(key, opts.searchType)),
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
   * @deprecated {@see columnHelper2.generate}
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
   */
  generateSwitch: async (key, title, extras: Asuna.Schema.RecordRenderExtras): Promise<ColumnProps<any>> => ({
    title,
    dataIndex: castModelKey(key),
    key: castModelKey(key),
    ...(await generateSearchColumnProps(castModelKey(key), 'boolean')),
    render: (isActive, record) => {
      const component = extras.readonly ? (
        <Checkbox checked={isActive} disabled={true} />
      ) : (
        <Popconfirm
          title={isActive ? `是否注销: ${record.id}` : `是否激活: ${record.id}`}
          onConfirm={async () => {
            // const { modelProxy } = require('../adapters');
            await AppContext.adapters.models.upsert(extras.modelName, { body: { id: record.id, [key]: !isActive } });
            extras.callRefresh();
          }}
        >
          <Checkbox checked={isActive} />
        </Popconfirm>
      );
      return extras.tips ? <Tooltip title={extras.tips}>{component}</Tooltip> : component;
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
  isPublished: columnHelper2.fpGenerateSwitch('isPublished', '发布'),
  actions: columnHelper.generateActions,
};

export const defaultColumns = actions => [commonColumns.id, commonColumns.updatedAt, commonColumns.actions(actions)];

export const defaultColumnsByPrimaryKey = (primaryKey = 'id') => actions => [
  commonColumns.primaryKey(primaryKey, primaryKey.toUpperCase()),
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
    return <>{component}</>;
  }
  return link ? <TextLink url={component} text={component} /> : <>{component}</>;
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

export function parseType(key: ParseType, name: string): string {
  if (!name) return '';
  const value = AppContext.constants?.[key]?.[name];
  if (!value) {
    console.warn('not found for constants', { key, name, map: AppContext.constants?.[key] });
  }
  return value ?? name;
}
