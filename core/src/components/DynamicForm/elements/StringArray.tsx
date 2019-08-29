import { createLogger } from '@asuna-admin/logger';
import { Button, Col, Input, Row } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';

import * as _ from 'lodash';
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

  _remove = index => {
    const items = this.props.items.splice(index, 1);
    this.props.onChange(items);
  };

  render(): React.ReactNode {
    const { items, onChange } = this.props;
    return (
      <React.Fragment>
        {_.map(items, (item, index) => (
          <Row gutter={16}>
            <Col span={20}>
              <Input
                key={index}
                value={item}
                onChange={e => {
                  items[index] = e.target.value;
                  this.setState({ items });
                  logger.debug(`update to`, { items });
                  onChange(items);
                }}
              />
            </Col>
            <Col span={4}>
              <Button type="danger" block onClick={() => this._remove(index)}>
                X
              </Button>
            </Col>
          </Row>
        ))}
        <Button type="primary" block onClick={this._add}>
          Add
        </Button>
      </React.Fragment>
    );
  }
}
