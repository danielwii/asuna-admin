import * as React from 'react';

export default ({ children, Component }) => {
  return (
    <div>
      {/*<Component />*/}
      <pre>{JSON.stringify({ children, Component })}</pre>
    </div>
  );
};
