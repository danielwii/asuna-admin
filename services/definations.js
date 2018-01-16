import moment from 'moment';
import * as R from 'ramda';

import { DynamicFormTypes } from '../components/DynamicForm';

export const tableColumns = {
  colleges: actions => ([
    {
      title    : 'ID',
      dataIndex: 'id',
      key      : 'id',
    }, {
      title    : '名称',
      dataIndex: 'name',
      key      : 'name',
    }, {
      title    : '英文名称',
      dataIndex: 'name_en',
      key      : 'name_en',
    }, {
      title    : '创建时间',
      dataIndex: 'createdAt',
      key      : 'createdAt',
      render   : text => moment(text).calendar(),
    }, {
      title    : '更新时间',
      dataIndex: 'updatedAt',
      key      : 'updatedAt',
      render   : text => moment(text).calendar(),
    }, {
      title : 'Action',
      key   : 'action',
      render: actions,
    },
  ]),
};

export const modelColumns = {
  colleges: (fields, actions) => ({
    fields: {
    },
    actions,
  }),
};
