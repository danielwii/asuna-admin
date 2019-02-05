import React, { useState } from 'react';
import * as util from 'util';

import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';

export function DebugSettings(props) {
  const { modules, onChange } = props;
  const state = useState({});
  // const [modules] = state;
  return (
    <div>
      <LoaderInline />
      <pre>{util.inspect({ props, state, modules })}</pre>
    </div>
  );
}
