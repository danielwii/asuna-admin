import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { message } from 'antd';
import { AxiosResponse, AxiosError } from 'axios';
import * as R from 'ramda';

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
    return JSON.stringify(e?.response?.data);
  }
  return e.message || JSON.stringify(e);
}

export function isErrorResponse(error) {
  const isError = R.pathEq(['response', 'data', 'name'], 'Error')(error);
  const isAsuna = /^ASUNA__.+/.test(R.path(['response', 'data', 'code'])(error));
  return isError || isAsuna;
}

export function toFormErrors(response: AxiosResponse): FormError | string | null {
  if (!response) {
    return null;
  }
  if (response.data.error) {
    const { error } = response.data as Asuna.Error.ErrorResponse;
    if (response.status === 400) {
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
    message.error(`${error.name}(${error.code}): ${error.message}`);
    return error.message;
  }

  logger.warn('[toFormErrors]', { response });
  return response.data;
}
