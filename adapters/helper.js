// @flow weak
// export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });
import moment from 'moment/moment';

// TODO make helpers configurable
export const authHeader = token => ({ headers: { Authorization: token } });

export const actionHelper = {};

export const columnHelper = {
  generate        : (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : text => (render ? render(text) : text),
  }),
  generateCalendar: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : text => (render ? render(text) : moment(text).calendar()),
  }),
  /**
   * 生成动作按钮
   * @param actions 最终的渲染函数
   * @param extras 需要接受 auth 参数传入
   * @returns {{key: string, title: string, render: function(*=, *=): *}}
   */
  generateActions : (actions, extras) => ({
    key   : 'action',
    title : 'Action',
    render: (text, record) =>
      actions(text, record, extras ? auth => extras(text, record, auth) : null),
  }),
};

/**
 * 通用配置
 */
export const commonColumns = {
  any       : any => columnHelper.generate(any, any.toUpperCase()),
  id        : columnHelper.generate('id', 'ID'),
  name      : columnHelper.generate('name', '名称'),
  title     : columnHelper.generate('title', '标题'),
  name_en   : columnHelper.generate('name_en', '英文名称'),
  email     : columnHelper.generate('email', 'Email'),
  createdAt : columnHelper.generateCalendar('createdAt', '创建时间'),
  created_at: columnHelper.generateCalendar('created_at', '创建时间'),
  updatedAt : columnHelper.generateCalendar('updatedAt', '更新时间'),
  updated_at: columnHelper.generateCalendar('updated_at', '更新时间'),
  actions   : columnHelper.generateActions,
};

export const defaultColumns = actions => [
  commonColumns.id,
  // commonColumns.createdAt,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];
