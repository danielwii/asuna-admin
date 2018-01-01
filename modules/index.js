import React   from 'react';
import dynamic from 'next/dynamic';
import _       from 'lodash';

export default dynamic({
  modules: ({ module }) => {
    const components = {
      'models::index': import('./models'),
      'models::setup': import('./models/setup'),
      default        : import('./undefined'),
    };

    console.log('looking for module', module);

    if (_.has(components, module)) {
      console.log('module includes in components', components);
      return { Component: components[module] };
    }

    const found = _.find(components, (component, key) => module.startsWith(key));
    if (found) {
      console.log('found', found);
      return { Component: found };
    }
    console.log('return no module defined component');

    return { Component: components.default };
  },
  render : (props, { Component }) => <Component />,
});
