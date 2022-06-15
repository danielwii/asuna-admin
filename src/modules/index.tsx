import * as _ from 'lodash';
import dynamic from 'next/dynamic';
import * as React from 'react';
import { useMemo } from 'react';
import useLogger from 'react-use/lib/useLogger';

import { DebugSettings } from '../components/DebugSettings';
import { withDebugSettingsProps } from '../containers/DebugSettings';
import { AppContext } from '../core/context';
import { DebugInfo } from '../helpers/debug';
import { createLogger } from '../logger';

import type { Pane } from '../components/Panes';

const logger = createLogger('modules:index');

export class ModuleRegister {
  static renders = {
    DebugSettings: (props) => withDebugSettingsProps((innerProps) => <DebugSettings {...props} {...innerProps} />),
  };
}

const components = {
  'content::index': dynamic(() => import('./content/index')),
  'content::view': dynamic(() => import('./content/view')),
  'content::query': dynamic(() => import('./content/query')),
  'content::upsert': dynamic(() => import('./content/upsert')),
  'content::blank': dynamic(() => import('./content/blank')),
  default: dynamic(() => import('./undefined')),
};

const getModule = (module: keyof typeof components) => {
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
};

export interface ModulesLoaderProps {
  module: keyof typeof components;
  activeKey: string;
  onClose: () => void;
  basis: { pane: Pane };
  onTitleChange: (newTitle: string) => void;
  component?: any;
}

const ModulesIndex: React.FC<ModulesLoaderProps> = (props) => {
  const { module, component } = props;
  const Component = useMemo(() => getModule(module), [module]);

  useLogger('<[ModulesIndex]>', props);

  if (component) {
    const moduleRender = ModuleRegister.renders[component];

    logger.log('render', { component, moduleRender, components: AppContext.ctx?.components });
    if (moduleRender) {
      return moduleRender(props);
    }

    const fc = AppContext.ctx.components.load(component);
    return fc ? (
      fc(props)
    ) : (
      <>
        <b>Component '{component}' not found.</b>
        <DebugInfo data={{ props, components: AppContext.ctx.components }} divider />
      </>
    );
  }

  // const Component = getModule(module);
  return <Component {...props} />;
};

export default ModulesIndex;
