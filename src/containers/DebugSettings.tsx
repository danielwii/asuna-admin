import * as React from 'react';

import { IDebugSettingsProps } from '../components';
import { modules, updateLoggerLevel } from '../logger';

export function withDebugSettingsProps(fn: (props: IDebugSettingsProps) => any) {
  return fn({ modules, updateLoggerLevel });
}
