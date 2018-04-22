import React       from 'react';
import * as moment from 'moment';
import * as R      from 'ramda';
import deepDiff    from 'deep-diff';
import Truncate    from 'react-truncate';

import { Tooltip } from 'antd';

import { AuthHeader, config, ConfigKey } from '../app/configure';

import { castModelKey } from './cast';

import { createLogger, lv } from './logger';

const logger = createLogger('helpers', lv.warn);

export * from './logger';
export * from './cast';
export * from './error';

export const authHeader = (token) => {
  if (config.is(ConfigKey.AUTH_HEADER, AuthHeader.AuthHeaderAsBearerToken)) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return { headers: { Authorization: token } };
};

export const columnHelper = {
  generate        : (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : (text) => {
      const value = render ? render(text) : text;
      return (
        <Truncate
          trimWhitespace
          lines={1}
          ellipsis={<Tooltip title={value}>...</Tooltip>}
        >{value}</Truncate>
      );
    },
  }),
  generateCalendar: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    render   : (text) => {
      if (text) {
        const value = render ? render(text) : moment(text).calendar();
        return (
          <Truncate
            trimWhitespace
            lines={1}
            ellipsis={<Tooltip title={value}>...</Tooltip>}
          >{value}</Truncate>
        );
      }
      return 'n/a';
    },
  }),
  /**
   * 生成动作按钮
   * @param actions 最终的渲染函数
   * @param extras 需要接受 auth 参数传入
   * @returns {{key: string, title: string, render: function(*=, *=): *}}
   */
  generateActions : (actions, extras?) => ({
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
  any        : any => columnHelper.generate(any, any.toUpperCase()),
  id         : columnHelper.generate('id', 'ID'),
  name       : columnHelper.generate('name', '名称'),
  description: columnHelper.generate('description', '描述'),
  title      : columnHelper.generate('title', '标题'),
  nameEn     : columnHelper.generate(castModelKey('nameEn'), '英文名称'),
  email      : columnHelper.generate('email', 'Email'),
  type       : columnHelper.generate('type', '类型'),
  createdAt  : columnHelper.generateCalendar(castModelKey('createdAt'), '创建时间'),
  updatedAt  : columnHelper.generateCalendar(castModelKey('updatedAt'), '更新时间'),
  actions    : columnHelper.generateActions,
};

export const defaultColumns = actions => [
  commonColumns.id,
  // TODO 需要一个基本字段名称转换的参数来选择使用的渲染配置
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const defaultNameColumns = actions => [
  commonColumns.id,
  commonColumns.name,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const defaultTitleColumns = actions => [
  commonColumns.id,
  commonColumns.title,
  commonColumns.updatedAt,
  commonColumns.actions(actions),
];

export const diff = (first, second, opts: { include?, exclude? } = {}) => {
  let verbose;
  if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.include))) {
    verbose = deepDiff(R.pickAll(opts.include)(first), R.pickAll(opts.include)(second));
  } else if (R.not(R.anyPass([R.isEmpty, R.isNil])(opts.exclude))) {
    verbose = deepDiff(R.omit(opts.include)(first), R.omit(opts.include)(second));
  } else {
    verbose = deepDiff(first, second);
  }
  return { verbose, isDifferent: !!verbose };
};
