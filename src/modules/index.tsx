import React from 'react';
import dynamic from 'next/dynamic';
import _ from 'lodash';

import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('modules:index');

function getModule(components, module) {
  logger.debug('looking for module', module);

  if (_.has(components, module)) {
    logger.debug('module includes in components', components);
    return components[module];
  }

  const found = _.find(components, (component, key) => module.startsWith(key));
  if (found) {
    logger.log('found', found);
    return found;
  }
  logger.log('return no module defined component');

  return components.default;
}

export default dynamic({
  modules: () =>
    ({
      'content::index': () => import('./content/index'),
      'content::upsert': () => import('./content/upsert'),
      default: () => import('./undefined'),
    } as any),
  render: (props, components) => {
    logger.log({ props });
    const { module } = props as any;
    const Component = getModule(components, module).default;
    return <Component {...props} />;
  },
}) as any;
