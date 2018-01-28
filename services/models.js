import axios from 'axios';

import { createLogger } from '../adapters/logger';
import { authHeader }   from '../adapters/helper';

const logger = createLogger('service:models');

const instance = axios.create({
  baseURL: '/',
  timeout: 10000,
});

export const modelsService = {
  // save({ token }, { name }) {
  //   return instance.post('/content/models', { name }, authHeader(token));
  // },
  // refreshModels({ token }, pageable = {}) {
  //   return instance.get('/content/models', { params: pageable, ...authHeader(token) });
  // },
  fetch({ token }, modelName, { endpoint, id, profile }) {
    const url    = endpoint ? `${endpoint}/${id}` : `/rest/${modelName}/${id}`;
    const config = { params: { profile }, ...authHeader(token) };
    return instance.get(url, config);
  },
  loadAssociation({ token }, associationName, { endpoint, fields = [] }) {
    logger.log('loadAssociation', associationName, fields);
    const url    = endpoint || `/rest/${associationName}`;
    const config = {
      params: {
        size  : 100,
        fields: fields.join(','),
      },
      ...authHeader(token),
    };
    return instance.get(url, config);
  },
  loadModels({ token }, name, { endpoint, pagination, filters, sorter }) {
    const url    = endpoint || `/rest/${name}`;
    const config = { params: pagination, ...authHeader(token) };
    return instance.get(url, config);
  },
  loadSchema({ token }, name, { endpoint }) {
    const url    = endpoint || `/rest/${name}`;
    const config = authHeader(token);
    return instance.options(url, config);
  },
  insert({ token }, modelName, { endpoint, body }) {
    const url    = endpoint || `/rest/${modelName}`;
    const config = authHeader(token);
    return instance.post(url, body, config);
  },
  update({ token }, modelName, { endpoint, id, body }) {
    const url    = endpoint ? `${endpoint}/${id}` : `/rest/${modelName}/${id}`;
    const config = authHeader(token);
    return instance.put(url, body, config);
  },
};
