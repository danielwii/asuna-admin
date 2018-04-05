import axios from 'axios';

import { createLogger } from '../adapters/logger';
import { authHeader }   from '../helpers';

const logger = createLogger('service:models');

const instance = axios.create({
  baseURL: '/',
  timeout: 30000,
});

// eslint-disable-next-line import/prefer-default-export
export const modelsService = {
  fetch({ token }, modelName, { endpoint, id, profile }) {
    const url    = endpoint ? `${endpoint}/${id}` : `/rest/${modelName}/${id}`;
    const config = { params: { profile }, ...authHeader(token) };
    return instance.get(url, config);
  },
  remove({ token }, modelName, { endpoint, id }) {
    const url    = endpoint ? `${endpoint}/${id}` : `/rest/${modelName}/${id}`;
    const config = authHeader(token);
    return instance.delete(url, config);
  },
  loadAssociation({ token }, associationName, { endpoint, fields = [] }) {
    logger.info('loadAssociation', associationName, fields);
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
  loadModels({ token }, name, {
    // eslint-disable-next-line no-unused-vars
    endpoint, pagination, filters, sorter,
  }) {
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
    return instance.patch(url, body, config);
  },
};
