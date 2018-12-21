import React from 'react';
import moment from 'moment';
import * as R from 'ramda';
import _ from 'lodash';
import deepDiff from 'deep-diff';
import Truncate from 'react-truncate';
import { join } from 'path';
import styled from 'styled-components';

import { Button, Checkbox, Icon, Popconfirm, Tooltip } from 'antd';

import { castModelKey } from './cast';

import { Config } from '@asuna-admin/config';
import { createLogger } from '@asuna-admin/logger';
import { AppContext } from '@asuna-admin/core';

const logger = createLogger('helpers', 'warn');

export * from './cast';
export * from './error';
export * from './func';

const FluxCenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5f5f5;
  border-radius: 0.2rem;
  padding: 0.1rem;
`;

const ThumbImage = styled.img`
  max-width: 200px;
  max-height: 80px;
`;

export const authHeader = token => {
  if (Config.is('AUTH_HEADER', 'AuthHeaderAsBearerToken')) {
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
  generateRelation: (key, title, render?) => ({
    key,
    title,
    relation: key,
    dataIndex: key,
    render: text => {
      if (typeof render === 'string') {
        return text ? text[render] : null;
      }
      return render ? render(text) : text;
    },
  }),
  generate: (key, title, render?) => ({
    key,
    title,
    dataIndex: key,
    sorter: true,
    render: text => {
      const value = render ? render(text) : text;
      if (typeof value === 'string' && value.length > 20) {
        return <Tooltip title={value}>{`${value.slice(0, 20)}...`}</Tooltip>;
      }
      return value;
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
      }
      return 'n/a';
    },
  }),
  generateCalendar: (key, title, render?) => ({
    key: castModelKey(key),
    title,
    dataIndex: castModelKey(key),
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
   * @returns {{key: string, title: string, render: function(*=, *=): *}}
   */
  generateActions: actions => ({
    key: 'action',
    title: 'Action',
    render: actions,
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
            const host = Config.get('IMAGE_HOST');
            return _.map(images, image => (
              <FluxCenterBox key={image}>
                <ThumbImage src={join(host || '', image)} />
              </FluxCenterBox>
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
   * @param {any} modelName
   * @param {any} callRefresh
   * @returns {{title: any; dataIndex: string | any; key: string | any; render: (isActive, record) => any}}
   */
  generateSwitch: (key, title, { modelName, callRefresh }) => ({
    title,
    dataIndex: castModelKey(key),
    key: castModelKey(key),
    render: (isActive, record) => (
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
  ordinal: columnHelper.generate('ordinal', '序号'),
  description: columnHelper.generate('description', '描述'),
  title: columnHelper.generate('title', '标题'),
  nameEn: columnHelper.generate('nameEn', '英文名称'),
  email: columnHelper.generate('email', 'Email'),
  type: columnHelper.generate('type', '类型'),
  createdAt: columnHelper.generateCalendar('createdAt', '创建时间'),
  updatedAt: columnHelper.generateCalendar('updatedAt', '更新时间'),
  isPublished: _.curry(columnHelper.generateSwitch)('isPublished', '发布'),
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
