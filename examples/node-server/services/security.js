// @flow weak
import axios from 'axios';

import { authHeader } from '../helpers';

import type { ISecurityService } from '../adapters/security';


const instance = axios.create({
  baseURL: '/',
  timeout: 30000,
});

// eslint-disable-next-line import/prefer-default-export
export const securityService: ISecurityService = {
  currentUser: ({ opts: { token }, config: { endpoint } = {} }) => {
    const url    = endpoint || '/admin/auth/current';
    const config = { ...authHeader(token) };
    return instance.get(url, config);
  },

  roles: ({ opts: { token }, config: { endpoint } = {} }) => {
    const url    = endpoint || '/admin/auth/roles';
    const config = { ...authHeader(token) };
    return instance.get(url, config);
  },

  updatePassword: ({ opts: { token }, data: { body }, config: { endpoint } = {} }) => {
    const url    = endpoint || '/admin/auth/reset';
    const config = { ...authHeader(token) };
    return instance.post(url, body, config);
  },
};
