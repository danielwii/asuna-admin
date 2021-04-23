import { KvArray, KvArrayItem, KvArrayProps } from '@danielwii/asuna-components';
import { WithVariable } from '@danielwii/asuna-components/dist/helper/helper';

import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { createLogger } from '../../../logger';

import type { FormComponentProps, WrappedFormUtils } from '@ant-design/compatible/es/form/Form';

const logger = createLogger('components:dynamic-form:kv-array');

export type KVArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: KvArrayItem[];
  onChange: (items: KvArrayItem[]) => void;
  mode?: 'input' | 'tag';
};

const KVArrayHOC: React.FC<Partial<FormComponentProps> & Partial<KvArrayProps>> = (props) => {
  // useLogger(`KvArray(key=${KVArrayHOC.name})`, props);
  return (
    <WithVariable variable={props as FormComponentProps & KvArrayProps}>
      {(props) => <KvArray {...props} onChange={(items) => props.onChange(items)} />}
    </WithVariable>
  );
};

export function generateKVArray(
  form: WrappedFormUtils,
  { key, name, label, items, onChange, mode }: KVArrayOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateKVArray]', { items });

  return generateComponent(form, { fieldName, labelName }, <KVArrayHOC items={[...(items ?? [])]} />, formItemLayout);
}
