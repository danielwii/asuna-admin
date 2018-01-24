import axios from 'axios';

import { createLogger } from '../adapters/logger';
import { authHeader }   from '../adapters/helper';

const logger = createLogger('service:models');

const instance = axios.create({
  baseURL: '/rest/',
  timeout: 10000,
});

export const modelsService = {
  // save({ token }, { name }) {
  //   return instance.post('/content/models', { name }, authHeader(token));
  // },
  // refreshModels({ token }, pageable = {}) {
  //   return instance.get('/content/models', { params: pageable, ...authHeader(token) });
  // },
  fetch({ token }, modelName, { id, profile }) {
    return instance.get(`${modelName}/${id}`, { params: { profile }, ...authHeader(token) });
  },
  loadAssociation({ token }, associationName, { fields = [] }) {
    logger.log('loadAssociation', associationName, fields);
    return instance.get(associationName, {
      params: {
        size  : 100,
        fields: fields.join(','),
      },
      ...authHeader(token),
    });
  },
  loadModels({ token }, name, { pagination, filters, sorter }) {
    return instance.get(name, { params: pagination, ...authHeader(token) });
  },
  loadSchema({ token }, name) {
    return instance.options(name, authHeader(token));
  },
  insert({ token }, modelName, { body }) {
    return instance.post(modelName, body, authHeader(token));
  },
  update({ token }, modelName, { id, body }) {
    return instance.put(`${modelName}/${id}`, body, authHeader(token));
  },
};
