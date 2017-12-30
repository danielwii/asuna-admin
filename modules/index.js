import React   from 'react';
import dynamic from 'next/dynamic';

export default dynamic({
  modules: ({ module }) => {
    const components = {
      'models::setup': import('./models'),
      'models::list' : import('./models/list'),
    };

    const Component = components[module];

    if (!Component) {
      return { Component: <div>no `{module}` defined.</div> };
    }

    return { Component };
  },
  render : (props, { Component }) => (
    <div>
      <h1>
        {props.key} - {props.title}
      </h1>
      <Component />
    </div>
  ),
});
