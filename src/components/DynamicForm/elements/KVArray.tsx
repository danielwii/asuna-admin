import { KVArray, KVArrayItem, KVArrayProps, WithVariable } from '@danielwii/asuna-components';
import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { createLogger } from '../../../logger';

import type { FormComponentProps, WrappedFormUtils } from '@ant-design/compatible/es/form/Form';

const logger = createLogger('components:dynamic-form:kv-array');

export type KVArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: KVArrayItem[];
  onChange: (items: KVArrayItem[]) => void;
  mode?: 'input' | 'tag';
};

const KVArrayHOC: React.FC<Partial<FormComponentProps> & Partial<KVArrayProps>> = (props) => {
  // useLogger(`KVArray(key=${KVArrayHOC.name})`, props);
  return (
    <WithVariable variable={props as FormComponentProps & KVArrayProps}>
      {(props) => <KVArray {...props} onChange={(items) => props.onChange(items)} />}
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
