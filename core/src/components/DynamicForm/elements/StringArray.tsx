import { createLogger } from '@asuna-admin/logger';

import * as _ from 'lodash';
import { Button, Input } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import React from 'react';

import { defaultFormItemLayout, generateComponent, IFormItemLayout } from '.';

const logger = createLogger('components:dynamic-form:string-array');

export type StringArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
};

export function generateStringArray(
  form: WrappedFormUtils,
  { key, name, label, items, onChange }: StringArrayOptions,
  formItemLayout: IFormItemLayout = defaultFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateStringArray]', { items });

  return generateComponent(
    form,
    { fieldName, labelName },
    <StringArray items={items || []} onChange={onChange} />,
    formItemLayout,
  );
}

interface IStringArrayProps {
  items: string[];
  onChange: (items: string[]) => void;
}

class StringArray extends React.Component<IStringArrayProps> {
  _add = () => {
    this.props.onChange(this.props.items.concat(''));
  };

  render(): React.ReactNode {
    const { items } = this.props;
    return (
      <React.Fragment>
        {_.map(items, (item, index) => (
          <Input
            key={index}
            value={item}
            onChange={e => {
              items[index] = e.target.value;
              this.setState({ items });
            }}
          />
        ))}
        <Button type="primary" block onClick={this._add}>
          Add
        </Button>
      </React.Fragment>
    );
  }
}
