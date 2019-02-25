import { AxiosResponse } from 'axios';
import * as R from 'ramda';

import { createLogger } from '@asuna-admin/logger';
import idx from 'idx';

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

export function toErrorMessage(e) {
  if (e.response) {
    return idx(e, _ => _.response.data.message);
  }
  return e.message;
}

export function isErrorResponse(error) {
  const isError = R.pathEq(['response', 'data', 'name'], 'Error')(error);
  const isAsuna = /^ASUNA__.+/.test(R.path(['response', 'data', 'code'])(error));
  return isError || isAsuna;
}

export function toFormErrors(response: AxiosResponse): FormError | string | null {
  if (response === null) {
    return null;
  }
  if (response.status === 400) {
    const exception = response.data as Asuna.Error.ValidationException;
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
    )(exception.errors);
    logger.log('[toFormErrors]', { response, errorFields });
    return R.mergeAll(errorFields);
  }
  if (response.status === 500) {
    // FIXME may be a normal exception
    const exception = response.data as Asuna.Error.AsunaException;
    return exception.message;
  }
  logger.warn('[toFormErrors]', { response });
  return response.data;
}
