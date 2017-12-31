import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/admin',
  timeout: 60000,
  // headers: { 'X-Custom-Header': '' },
});

export const login = (username, password) => instance.post('/auth/login', { username, password });
