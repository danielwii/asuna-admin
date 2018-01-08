import axios from 'axios';

const instance = axios.create({
  baseURL: '/sys/',
  timeout: 100000,
  // headers: { 'X-Custom-Header': '' },
});

export const login = (username, password) => instance.post('api-token-auth', { username, password });
