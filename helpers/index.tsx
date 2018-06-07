import React from 'react';
import * as moment from 'moment';
import * as R from 'ramda';
import _ from 'lodash';
import deepDiff from 'deep-diff';
import Truncate from 'react-truncate';
import { join } from 'path';

import { Checkbox, Popconfirm, Tooltip, Icon, Button } from 'antd';

import { AuthHeader, config, ConfigKey } from '../app/configure';

import { castModelKey } from './cast';
import { createLogger, lv } from './logger';

const logger = createLogger('helpers', lv.warn);

export * from './logger';
export * from './cast';
export * from './error';

export const authHeader = token => {
  if (config.is(ConfigKey.AUTH_HEADER, AuthHeader.AuthHeaderAsBearerToken)) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return { headers: { Authorization: token } };
};

export const columnHelper = {
  generateOriginal: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => (render ? render(text) : text),
  }),
  generateID: (key = 'id', title = 'ID', render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => (render ? render(text) : text),
  }),
  generate: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      const value = render ? render(text) : text;
      return (
        <Truncate trimWhitespace lines={1} ellipsis={<Tooltip title={value}>...</Tooltip>}>
          {value}
        </Truncate>
      );
    },
  }),
  generateLink: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      if (text) {
        const value = render ? render(text) : text;
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
  generateCalendar: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      if (text) {
        const value = render ? render(text) : moment(text).calendar();
        return (
          <Truncate trimWhitespace lines={1} ellipsis={<Tooltip title={value}>...</Tooltip>}>
            {value}
          </Truncate>
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
  generateActions: (actions, extras?) => ({
    key: 'action',
    title: 'Action',
    render: (text, record) =>
      actions(text, record, extras ? auth => extras(text, record, auth) : null),
  }),
  /**
   * 生成预览小图
   * TODO 增加预览大图功能
   * @param key
   * @param title
   * @param render
   */
  generateImage: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      if (text) {
        try {
          const value = render ? render(text) : text;
          if (value) {
            const images = value.split(',');
            const host = config.get(ConfigKey.IMAGE_HOST);
            return _.map(images, (image, index) => (
              <img key={index} src={join(host, image)} width="200" />
            ));
          }
        } catch (e) {
          logger.error('[generateImage]', e, { key, title, text });
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
   * @param {any} auth
   * @param {any} modelName
   * @param {any} callRefresh
   * @returns {{title: any; dataIndex: string | any; key: string | any; render: (isActive, record) => any}}
   */
  generateBoolean: (key, title, { auth, modelName, callRefresh }) => ({
    title: title,
    dataIndex: castModelKey(key),
    key: castModelKey(key),
    render: (isActive, record) => (
      <Popconfirm
        title={isActive ? `是否注销: ${record.id}` : `是否激活: ${record.id}`}
        onConfirm={async () => {
          const { modelProxy } = require('../adapters/model');
          await modelProxy.upsert(auth, modelName, {
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
    ),
  }),
};

/**
 * 通用配置
 */
export const commonColumns = {
  any: (key, title?) => columnHelper.generate(key, title || key.toUpperCase()),
  id: columnHelper.generateID(),
  name: columnHelper.generate('name', '名称'),
  description: columnHelper.generate('description', '描述'),
  title: columnHelper.generate('title', '标题'),
  nameEn: columnHelper.generate(castModelKey('nameEn'), '英文名称'),
  email: columnHelper.generate('email', 'Email'),
  type: columnHelper.generate('type', '类型'),
  createdAt: columnHelper.generateCalendar(castModelKey('createdAt'), '创建时间'),
  updatedAt: columnHelper.generateCalendar(castModelKey('updatedAt'), '更新时间'),
  actions: columnHelper.generateActions,
};

export const defaultColumns = actions => [
  commonColumns.id,
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

export const diff = (first, second, opts: { include?; exclude? } = {}) => {
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
