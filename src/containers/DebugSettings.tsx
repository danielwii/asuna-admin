import * as React from 'react';

import { IDebugSettingsProps } from '@asuna-admin/components';
import { modules, updateLoggerLevel } from '@asuna-admin/logger';

export function withDebugSettingsProps(fn: (props: IDebugSettingsProps) => any) {
  return fn({ modules, updateLoggerLevel });
}
