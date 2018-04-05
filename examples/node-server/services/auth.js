// @flow
import axios                 from 'axios';
import * as R                from 'ramda';

import type { IAuthService } from '../adapters/auth';

const instance = axios.create({
  baseURL: '/',
  timeout: 30000,
});

// eslint-disable-next-line import/prefer-default-export
export const authService: IAuthService = {
  login: ({ body: { username: email, password } }) =>
    instance.post('admin/auth/login', { email, password }),

  logout: () =>
    instance.get('admin/auth/logout'),

  extractToken: R.path(['response', 'user', 'authentication_token']),
};
