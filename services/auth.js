import axios from 'axios';

const instance = axios.create({
  baseURL: '/sys/',
  timeout: 10000,
  // headers: { 'X-Custom-Header': '' },
});

export const loginReal = (username, password) => instance.post('api-token-auth', {
  username,
  password,
});
export const login     = (username, password) => ({
  data: { token: 'temp-token' },
});
