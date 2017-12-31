import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/admin',
  timeout: 60000,
});

export const modelsColumns = [
  {
    title    : '姓名',
    dataIndex: 'name',
    key      : 'name',
  }, {
    title    : '年龄',
    dataIndex: 'age',
    key      : 'age',
  }, {
    title    : '住址',
    dataIndex: 'address',
    key      : 'address',
  },
];

export const apiModelsDataSource = () => [{
  key    : '1',
  name   : '胡彦斌',
  age    : 32,
  address: '西湖区湖底公园1号',
}, {
  key    : '2',
  name   : '胡彦祖',
  age    : 42,
  address: '西湖区湖底公园1号',
}];

export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });

export const modelsApi = {
  save({ token }, { name }) {
    return instance.post('/content/models', { name }, authHeader(token));
  },
  refresh({ token }, pageable) {
    return instance.get('/content/models', pageable, authHeader(token));
  },
};
