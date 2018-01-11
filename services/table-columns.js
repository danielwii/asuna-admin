import React from 'react';

import { Button, Divider } from 'antd';
import moment              from 'moment';

moment.locale('zh-cn');

export const modelColumns = {
  colleges: [
    {
      title    : 'ID',
      dataIndex: 'id',
      key      : 'id',
    }, {
      title    : '名称',
      dataIndex: 'name',
      key      : 'name',
    }, {
      title    : '创建时间',
      dataIndex: 'createdAt',
      key      : 'createdAt',
      render   : text => moment(text).calendar(),
    }, {
      title : 'Action',
      key   : 'action',
      render: (text, record) => (
        <span>
          <Button size="small" type="dashed" onClick={() => this.openSetup(record)}>Edit</Button>
          <Divider type="vertical" />
        </span>
      ),
    },
  ],
};

export const tableColumns = {};
