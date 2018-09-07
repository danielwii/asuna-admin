import React from 'react';
import dynamic from 'next/dynamic';
import _ from 'lodash';

import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('modules:index');

export default dynamic({
  modules: ({ module }) => {
    const components = {
      'content::index': import('./content/index'),
      'content::upsert': import('./content/upsert'),
      default: import('./undefined'),
    };

    logger.debug('looking for module', module);

    if (_.has(components, module)) {
      logger.debug('module includes in components', components);
      return { Component: components[module] };
    }

    const found = _.find(components, (component, key) => module.startsWith(key));
    if (found) {
      logger.log('found', found);
      return { Component: found };
    }
    logger.log('return no module defined component');

    return { Component: components.default };
  },
  render: (props, { Component }) => <Component {...props} />,
});
