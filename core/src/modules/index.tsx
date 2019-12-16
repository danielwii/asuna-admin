import { DebugSettings, Pane } from '@asuna-admin/components';
import { withDebugSettingsProps } from '@asuna-admin/containers/DebugSettings';
import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';

import * as _ from 'lodash';
import * as util from 'util';
import dynamic from 'next/dynamic';
import * as React from 'react';

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
    DebugSettings: props => withDebugSettingsProps(innerProps => <DebugSettings {...props} {...innerProps} />),
  };
}

const components = {
  'content::index': dynamic(() => import('./content/index')),
  'content::query': dynamic(() => import('./content/query')),
  'content::upsert': dynamic(() => import('./content/upsert')),
  'content::blank': dynamic(() => import('./content/blank')),
  default: dynamic(() => import('./undefined')),
};

export interface ModulesLoaderProps {
  module: string;
  activeKey: string;
  onClose: () => void;
  basis: { pane: Pane };
  onTitleChange: (newTitle: string) => void;
  component?: any;
}

export default function(props: ModulesLoaderProps & { children?: React.ReactNode }) {
  logger.log({ props });
  const { module, component } = props as any;

  if (component) {
    const moduleRender = ModuleRegister.renders[component];

    if (moduleRender) return moduleRender(props);

    const fc = AppContext.ctx.components.load(component);
    return fc ? (
      fc(props)
    ) : (
      <>
        <b>Component '{component}' not found.</b>
        <pre>{util.inspect(props)}</pre>
      </>
    );
  }

  const Component = getModule(components, module);
  return <Component {...props} />;
}
