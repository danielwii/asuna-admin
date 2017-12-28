import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/admin/v1',
  timeout: 10000,
  // headers: { 'X-Custom-Header': '' },
});

export function login(username, password) {
  return instance.post('/auth/login', { username, password });
}
