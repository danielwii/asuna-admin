import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/admin/api/v1',
  timeout: 3000,
  // headers: { 'X-Custom-Header': '' },
});

export async function login(username, password) {
  await instance.post('/auth/login', { username, password });
}
