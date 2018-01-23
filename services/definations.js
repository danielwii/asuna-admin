/* eslint-disable max-len */
import moment from 'moment';

/**
 * 通用配置
 */
const commonColumns = {
  id       : {
    title    : 'ID',
    dataIndex: 'id',
    key      : 'id',
  },
  createdAt: {
    title    : '创建时间',
    dataIndex: 'createdAt',
    key      : 'createdAt',
    render   : text => moment(text).calendar(),
  },
  updatedAt: {
    title    : '更新时间',
    dataIndex: 'updatedAt',
    key      : 'updatedAt',
    render   : text => moment(text).calendar(),
  },
  actions  : actions => ({
    title : 'Action',
    key   : 'action',
    render: actions,
  }),
};

/**
 * 模型列表页配置
 * @type {{colleges: function(*=): *[], countries: function(*=): *[]}}
 */
export const tableColumns = {
  colleges : actions => [
    commonColumns.id,
    {
      title    : '名称',
      dataIndex: 'name',
      key      : 'name',
    },
    {
      title    : '英文名称',
      dataIndex: 'name_en',
      key      : 'name_en',
    },
    commonColumns.createdAt,
    commonColumns.updatedAt,
    commonColumns.actions(actions),
  ],
  countries: actions => [
    commonColumns.id,
    {
      title    : '名称',
      dataIndex: 'name',
      key      : 'name',
    },
    {
      title    : '英文名称',
      dataIndex: 'name_en',
      key      : 'name_en',
    },
    commonColumns.createdAt,
    commonColumns.updatedAt,
    commonColumns.actions(actions),
  ],
  articles: actions => [
    commonColumns.id,
    {
      title    : '名称',
      dataIndex: 'name',
      key      : 'name',
    },
    {
      title    : '英文名称',
      dataIndex: 'name_en',
      key      : 'name_en',
    },
    commonColumns.createdAt,
    commonColumns.updatedAt,
    commonColumns.actions(actions),
  ],
};

/**
 * 模型新增 / 编辑页面配置
 */
export const modelColumns = {
  colleges: {
    associations: {
      countries: {
        value : 'id',
        name  : 'name',
        ref   : 'country',
        fields: ['id', 'name'],
      },
    },
  },
  articles: {},
};

/**
 * 关联模型配置
 */
export const modelConfigs = {
  colleges : { table: tableColumns.colleges, model: modelColumns.colleges },
  countries: { table: tableColumns.countries, model: modelColumns.countries },
  articles: { table: tableColumns.articles, model: modelColumns.articles },
};

/**
 * 定义左侧导航条
 * @type {*[]}
 */
export const registeredModels = [
  {
    key     : 'content',
    title   : '内容管理',
    subMenus: [
      { key: 'colleges', title: '院校管理', linkTo: 'content::index' },
      { key: 'countries', title: '国家管理', linkTo: 'content::index' },
      { key: 'articles', title: '新闻管理', linkTo: 'content::index' },
    ],
  },
];
