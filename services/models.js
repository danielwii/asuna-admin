import axios  from 'axios';
import moment from 'moment';

moment.locale('zh-cn');

const instance = axios.create({
  baseURL: '/sys/',
  timeout: 10000,
});

export const authHeader = token => ({ headers: { Authorization: `Bearer ${token}` } });

export const modelsService = {
  // save({ token }, { name }) {
  //   return instance.post('/content/models', { name }, authHeader(token));
  // },
  // refreshModels({ token }, pageable = {}) {
  //   return instance.get('/content/models', { params: pageable, ...authHeader(token) });
  // },
  loadModels({ token }, { name }, pageable = {}) {
    console.log('call', name);
    return instance.get(name, { params: pageable, ...authHeader(token) });
  },
  loadOptions({ token }, { name }) {
    return instance.options(name, authHeader(token));
  },
};
