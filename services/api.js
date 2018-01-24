import axios from 'axios';

import { createLogger } from '../adapters/logger';
import { authHeader }   from '../adapters/helper';

const logger = createLogger('service:api');

const instance = axios.create({
  baseURL: '/admin/',
});

export const apiService = {
  upload({ token }, file, options) {
    const data = new FormData();
    data.append('files', file, file.name);
    return instance.post('uploader/upload', data, {
      headers: { 'content-type': 'multipart/form-data' },
      ...authHeader(token),
      ...options,
    });
  },
};
