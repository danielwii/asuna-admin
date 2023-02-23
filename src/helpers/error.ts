import { message } from 'antd';
import _ from 'lodash';
import * as R from 'ramda';

import { createLogger } from '../logger';
import { Asuna } from '../types';

import type { AxiosError, AxiosResponse } from 'axios';

const logger = createLogger('helpers:errors');

interface FormError {
  [key: string]: {
    errors: {
      field: string;
      message: string;
    }[];
  };
}

// TODO move to node-buffs one day :)
export const reduxActionCallbackPromise = (action): Promise<any> =>
  new Promise((resolve, reject) => {
    const callback = ({ response, error }) => (response ? resolve(response) : reject(error));
    action(callback);
  });

export type ReduxCallback<T> = (data: { response: T; error: Error }) => void;

export function safeCallback(cb, data) {
  try {
    if (cb != null) cb(data);
  } catch (e) {
    logger.warn('callback error', e, { e });
  }
}

export function parseResponseError(e: Partial<AxiosError>): any {
  return e.response?.data || e.message || e;
}

export function toErrorMessage(e) {
  logger.log('toErrorMessage', { e, response: e.response });
  if (e.response) {
    return JSON.stringify(e.response?.data);
  }
  return e.message || JSON.stringify(e);
}

export function isErrorResponse(error) {
  const isError = R.pathEq(['response', 'data', 'name'], 'Error')(error);
  const isAsuna = /^ASUNA__.+/.test(R.path<any>(['response', 'data', 'code'])(error));
  return isError || isAsuna;
}

export function toFormErrors(response: AxiosResponse): FormError | string | null {
  console.error('[toFormErrors]', response);
  if (!response) return null;
  if (response.data.error) {
    const { error } = response.data as Asuna.Error.ErrorResponse;
    if (response.status === 400 && error.errors) {
      const errorFields = R.map(
        (error: Asuna.Error.Validate): FormError => ({
          [error.property]: {
            errors: [
              {
                field: error.property,
                message: R.values(error.constraints).join('; '),
              },
            ],
          },
        }),
      )(error.errors);
      logger.log('[toFormErrors]', { response, errorFields });
      return R.mergeAll(errorFields);
    }
    message.error(`${response.data.status}(${_.get(error, 'type')}): ${JSON.stringify(response.data.message)}`);
    return error.message;
  }

  logger.warn('[toFormErrors]', { response });
  return response.data;
}
