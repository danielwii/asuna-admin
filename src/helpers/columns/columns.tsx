import { LinkOutlined, SearchOutlined } from '@ant-design/icons';

import { Button, Checkbox, Divider, Input, Popconfirm, Space, Tooltip } from 'antd';
import { Promise } from 'bluebird';
import * as _ from 'lodash';
import moment from 'moment';
import * as React from 'react';

import { VideoPlayer } from '../../components/DynamicForm/Videos';
import { TooltipContent } from '../../components/base/helper/helper';
import { AppContext } from '../../core/context';
import { createLogger } from '../../logger';
import { castModelKey } from './../cast';
import { WithDebugInfo } from './../debug';
import { extractValue, removePreAndSuf } from './../func';
import { nullProtectRender } from './utils';

import type { ColumnProps, ColumnType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { VideoJsPlayerOptions } from 'video.js';
import type { Asuna } from '../../types';
import type { ConditionType, ModelOpts, RelationColumnProps, SwitchConditionExtras } from './types';

const logger = createLogger('helpers:columns');

export async function generateSearchColumnProps(
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
        // case 'list':
        //   return removePreAndSuf(selectedKeys[0].$like, '%', '%');
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
    logger.info('handleSearch', { selectedKeys, confirm, dataIndex });
    confirm();
    onSearch({ searchText: selectedKeys, searchedColumn: dataIndex });
  };

  if (conditionType === 'list' && conditionExtras) {
    // const items = await AppContext.ctx.models
    //   .uniq(conditionExtras.model, dataIndex)
    //   .catch((reason) => logger.error('generateSearchColumnProps', reason));
    // if (items) {
    //   return {
    //     filterMultiple: false,
    //     filters: _.map(items, (item) => ({ text: item, value: item })),
    //   };
    // }
    return {
      filterMultiple: true,
      filters: _.map(conditionExtras.items, (item) => ({ text: item, value: item })),
    };
  }

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          addonBefore={conditionType}
          placeholder={`搜索 '${dataIndex}' ...`}
          value={getSelectedKey(selectedKeys)}
          onChange={(e) => setSelectedKeys(e.target.value ? getSelectedValue(e.target.value) : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
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
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : 'inherit' }} />,
  };
}

export const columnHelper = {
  generateID:
    ({ ctx }: Asuna.Schema.RecordRenderExtras) =>
    async (key = 'id', title = 'ID', transformer?): Promise<ColumnProps<any>> => ({
      key,
      title,
      dataIndex: key,
      sorter: true,
      ...(await generateSearchColumnProps(key, ctx.onSearch, 'like')),
      render: nullProtectRender((record) => (
        <WithDebugInfo info={{ key, title, record }}>{transformer ? transformer(record) : record}</WithDebugInfo>
      )),
    }),
  fpGenerateSubRelation:
    <RelationSchema extends object>(
      key: string,
      title: string,
      opts: {
        ref?: string;
        subRef: string;
        transformer: keyof RelationSchema;
        render?: (content, record?, extras?: Asuna.Schema.RecordRenderExtras) => React.ReactNode;
      },
    ) =>
    async (
      laterKey: string,
      actions: Asuna.Schema.RecordRenderActions,
      extras: Asuna.Schema.RecordRenderExtras,
    ): Promise<RelationColumnProps> => {
      let ref;
      let transformer;
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
            <div style={record?.isPublished === false || record?.isActive === false ? { color: 'darkred' } : {}}>
              {/*{record?.id ? (*/}
              {/*  <WithFuture*/}
              {/*    future={() =>*/}
              {/*      AppContext.ctx.models.batchFetch(opts.subRef, {*/}
              {/*        id: record.id,*/}
              {/*        relations: [opts.transformer as string],*/}
              {/*      })*/}
              {/*    }*/}
              {/*  >*/}
              {/*    {(data) => (*/}
              {/*      <WithDebugInfo info={{ key, title, opts, record, transformer }}>*/}
              {/*        {opts.render*/}
              {/*          ? opts.render(extractValue(data, transformer), data, extras)*/}
              {/*          : extractValue(data, transformer)}*/}
              {/*      </WithDebugInfo>*/}
              {/*    )}*/}
              {/*  </WithFuture>*/}
              {/*) : (*/}
              {/*  'n/a'*/}
              {/*)}*/}
            </div>
          );
        }),
      };
    },
  fpGenerateRelation:
    <RelationSchema extends object>(
      key: string,
      title: string,
      opts: {
        ref?: string;
        transformer?: keyof RelationSchema | ((record) => React.ReactChild);
        filterType?: 'list' | 'search';
        relationSearchField?: string;
        render?: (content, record?, extras?: Asuna.Schema.RecordRenderExtras) => React.ReactNode;
      },
    ) =>
    async (
      laterKey: string,
      actions: Asuna.Schema.RecordRenderActions,
      extras: Asuna.Schema.RecordRenderExtras,
    ): Promise<RelationColumnProps> => {
      let ref;
      let transformer;
      if (!opts.ref && !opts.transformer) {
        [ref, transformer] = key.split('.');
      }

      ref = ref || opts.ref || key;
      transformer = transformer || opts.transformer;
      let filterProps: ColumnType<string> = {};
      switch (opts.filterType) {
        // case 'list': {
        //   const modelName = extras.modelName;
        //   const primaryKey = AppContext.adapters.models.getPrimaryKey(modelName);
        //   const relation = AppContext.adapters.models.getFormSchema(modelName)[ref];
        //   const relationName = relation?.options?.selectable;
        //   if (relationName) {
        //     const field = opts.relationSearchField || 'name';
        //     const {
        //       data: { items },
        //     } = await AppContext.adapters.models.loadModels(relationName, {
        //       fields: [field],
        //       pagination: { pageSize: 500 },
        //     });
        //     filterProps = {
        //       filterMultiple: false,
        //       // 关联筛选时的搜索 key 为了区别同一个关联的不同字段，所以会包含非主键信息，这里传递整个包括主键的搜索信息
        //       filters: _.map(items, (item) => ({
        //         text: `${item[primaryKey]} / ${item[field]}`,
        //         value: JSON.stringify({ key: [`${ref}.${primaryKey}`], value: [item[primaryKey]] }),
        //       })),
        //     };
        //   }
        //   break;
        // }
        case 'search': {
          filterProps = await generateSearchColumnProps(
            `${ref}.${opts.relationSearchField || 'name'}`,
            extras.ctx.onSearch,
            'like',
          );
          break;
        }
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
              <div style={record?.isPublished === false || record?.isActive === false ? { color: 'darkred' } : {}}>
                {opts.render ? opts.render(content, record, extras) : content}
              </div>
            </WithDebugInfo>
          );
        }),
      };
    },
  generateLink: (
    key,
    title,
    opts: { transformer?: ((o: any) => any) | string; host?: string } = {},
  ): ColumnProps<any> => ({
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
              <div>({moment(record).fromNow()})</div>
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
  generateImage: (
    key,
    title,
    opts: { transformer?: ((o: any) => any) | string; host?: string } = {},
  ): ColumnProps<any> => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: nullProtectRender((record) => {
      const value = extractValue(record, opts.transformer);
      return (
        <WithDebugInfo info={{ key, title, opts, record }}>
          {/*{value ? <AssetsPreview key={key} urls={valueToArrays(value)} /> : record}*/}
        </WithDebugInfo>
      );
    }),
  }),
  generateVideo: (
    key,
    title,
    opts: { transformer?: ((o: any) => any) | string; host?: string } = {},
  ): ColumnProps<any> => ({
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
          sources: [{ src: value /* type: 'video/mp4', */ }],
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
    logger.info(`generateSwitch: ${key}`, { key, model, title, ctx, extras });
    const columnInfo = model ? await AppContext.getColumnInfo(model, key) : undefined;
    const columnProps = await generateSearchColumnProps(castModelKey(key), ctx.onSearch, 'boolean');
    logger.info(`generateSwitch: ${key}`, { columnInfo, columnProps });
    return {
      title: title ?? columnInfo?.config?.info?.name ?? key,
      dataIndex: castModelKey(key),
      key: castModelKey(key),
      ...columnProps,
      render: (isActive, record) => {
        const primaryKey = AppContext.adapters.models.getPrimaryKey(extras.modelName);
        const id = _.get(record, primaryKey);
        logger.info(`render switch: ${primaryKey}/${id}`, { isActive }, record);
        const component = extras.readonly ? (
          <Checkbox checked={isActive} disabled />
        ) : (
          <Popconfirm
            title={isActive ? `是否注销: ${id}` : `是否激活: ${id}`}
            onConfirm={async () => {
              await AppContext.adapters.models.upsert(extras.modelName, {
                body: { [primaryKey]: id, [key]: !isActive },
              });
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
