import axios from 'axios';

import { createLogger } from 'asuna-admin/adapters/logger';
import { authHeader }   from 'asuna-admin/helpers';

// eslint-disable-next-line no-unused-vars
const logger = createLogger('service:api');

const instance = axios.create({
  baseURL: '/',
  timeout: 30000,
});

// eslint-disable-next-line import/prefer-default-export
export const apiService = {
  upload({ token }, file, options) {
    const config = {
      headers: { 'content-type': 'multipart/form-data' },
      ...authHeader(token),
      ...options,
    };
    const data   = new FormData();
    data.append('files', file, file.name);
    return instance.post('admin/uploader/upload', data, config);
  },
  getVersion({ token }) {
    const url    = 'api/version';
    const config = authHeader(token);
    return instance.get(url, config);
  },
};
