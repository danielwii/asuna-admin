import { createLogger } from '@asuna-admin/logger';

import { Button, Divider, Icon, Input, Tag } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import * as _ from 'lodash';
import { TweenOneGroup } from 'rc-tween-one';
import * as React from 'react';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';

const logger = createLogger('components:dynamic-form:string-array');

export type StringArrayOptions = {
  key: string;
  name: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  mode?: 'input' | 'tag';
};

export function generateStringArray(
  form: WrappedFormUtils,
  { key, name, label, items, onChange, mode }: StringArrayOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.debug('[generateStringArray]', { items });

  return generateComponent(
    form,
    { fieldName, labelName },
    <StringArray mode={mode} items={items || []} onChange={onChange} />,
    formItemLayout,
  );
}

interface IStringArrayProps {
  mode?: 'input' | 'tag';
  items: string[];
  onChange: (items: string[]) => void;
}

export const StringArray: React.FC<IStringArrayProps> = ({ mode, items, onChange }) => {
  const [inputVisible, setInputVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const func = {
    add: (item: string = '') => onChange([...items, item]),
    remove: index => onChange(_.remove(items, (item, i) => i !== index)),
    showInput: () => setInputVisible(true),
    handleInputChange: e => setInputValue(e.target.value),
    handleInputConfirm: e => {
      if (!!_.trim(e.target.value)) {
        func.add(e.target.value);
      }
      setInputVisible(false);
      setInputValue('');
    },
  };

  if (mode === 'tag') {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <TweenOneGroup
            enter={{
              scale: 0.8,
              opacity: 0,
              type: 'from',
              duration: 100,
              onComplete: e => ((e.target as any).style = ''),
            }}
            leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }}
            appear={false}
          >
            {items.map((item, index) => (
              <span key={`${index}-${item}`} style={{ display: 'inline-block' }}>
                <Tag color="blue" closable onClose={() => func.remove(index)}>
                  {item}
                </Tag>
              </span>
            ))}
          </TweenOneGroup>
        </div>
        {inputVisible && (
          <Input
            autoFocus
            type="text"
            size="small"
            style={{ width: 200 }}
            value={inputValue}
            onChange={func.handleInputChange}
            onBlur={func.handleInputConfirm}
            onPressEnter={func.handleInputConfirm}
          />
        )}
        {!inputVisible && (
          <Tag onClick={func.showInput} style={{ background: '#fff', borderStyle: 'dashed' }}>
            <Icon type="plus" /> 添加
          </Tag>
        )}
      </div>
    );
  }

  return (
    <React.Fragment>
      {_.map(items, (item, index) => (
        <React.Fragment key={index}>
          <Input
            value={item}
            onChange={e => {
              items[index] = e.target.value;
              onChange(items);
            }}
            addonAfter={<Icon type="close" onClick={() => func.remove(index)} />}
          />
          <Divider dashed style={{ margin: '.1rem' }} />
        </React.Fragment>
      ))}
      <Button type="primary" onClick={() => func.add()}>
        Add
      </Button>
    </React.Fragment>
  );
};
