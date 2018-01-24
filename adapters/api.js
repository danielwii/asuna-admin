import * as R from 'ramda';
import _      from 'lodash';

import { createLogger } from '../adapters/logger';

const logger = createLogger('adapters:api', 1);

export const apiProxy = {
  upload: ({ token }, file, options) => global.context.api.upload({ token }, file, options),
};

export class ApiAdapter {
  constructor(service) {
    this.service = service;
  }

  upload = ({ token }, file, options) => {
    logger.info('[upload] file', file, options);
    return this.service.upload({ token }, file, options);
  }
}
