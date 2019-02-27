import React from 'react';
import dynamic from 'next/dynamic';
import _ from 'lodash';

import { createLogger } from '@asuna-admin/logger';
import { DebugSettings } from '@asuna-admin/components';
import { withDebugSettingsProps } from '@asuna-admin/containers/DebugSettings';
import { AppContext } from '@asuna-admin/core';

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

export class ModuleRegister {
  static renders = {
    DebugSettings: props =>
      withDebugSettingsProps(innerProps => <DebugSettings {...props} {...innerProps} />),
  };
}

export default dynamic({
  modules: () =>
    ({
      'content::index': () => import('./content/index'),
      'content::upsert': () => import('./content/upsert'),
      'content::blank': () => import('./content/blank'),
      default: () => import('./undefined'),
    } as any),
  render: (props, components) => {
    logger.log({ props });
    const { module, component } = props as any;

    if (component) {
      const moduleRender = ModuleRegister.renders[component];

      if (moduleRender) {
        // console.log('loader', { moduleRender, props });
        return moduleRender(props);
      }

      const fc = AppContext.ctx.components.load(component);
      // console.log('loader', { fc, props });
      return fc(props);
    }

    const Component = getModule(components, module).default;
    return <Component {...props} />;
  },
}) as any;
