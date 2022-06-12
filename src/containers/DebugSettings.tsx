import * as React from 'react';

import { modules, updateLoggerLevel } from '../logger';

import type { IDebugSettingsProps } from '../components/DebugSettings';

export function withDebugSettingsProps(fn: (props: IDebugSettingsProps) => any) {
  return fn({ modules, updateLoggerLevel });
}
