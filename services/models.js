import axios  from 'axios';
import moment from 'moment';

moment.locale('zh-cn');

const instance = axios.create({
  baseURL: '/api/admin',
  timeout: 60000,
});

export const modelsColumns = actions => [
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
    render: actions,
  },
];

export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });

export const modelsApi = {
  save({ token }, { name }) {
    return instance.post('/content/models', { name }, authHeader(token));
  },
  refreshModels({ token }, pageable = {}) {
    return instance.get('/content/models', { params: pageable, ...authHeader(token) });
  },
};
