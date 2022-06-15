import { parseJSONIfCould } from '@danielwii/asuna-helper/dist/utils';

import { Config } from '../config';
import { Asuna } from '../types';

export const authHeader = () => {
  const authToken = Store.fromStore().token;
  const schema = Config.get('AUTH_HEADER');
  return authToken
    ? schema === 'AuthHeaderAsBearerToken'
      ? { headers: { Authorization: `Bearer ${authToken}` } }
      : { headers: { Authorization: `${schema} ${authToken}` } }
    : {};
};

export interface StoreState {
  token: string | null;
  username: string | null;
  schemas: { [key: string]: Asuna.Schema.ModelSchema[] } | null;
}

export class Store {
  public static fromStore(): StoreState {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const schemas = parseJSONIfCould(localStorage.getItem('schemas') ?? '');
    return { token, username, schemas };
  }
}
