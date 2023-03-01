import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Button, Divider, Input, Tag } from 'antd';
import _ from 'lodash';
import { TweenOneGroup } from 'rc-tween-one';
import * as React from 'react';

import { createLogger } from '../../logger';
import { parseArray } from './helper/helper';

const logger = createLogger('components:base:string-array');

export interface IStringArrayProps {
  mode?: 'input' | 'tag';
  items: string[];
  onChange: (items: string[]) => void;
}

/**
 * @param mode
 * @param items TODO items 和 value 的值目前是一样的，应该是为了兼容 antd 的 form，之后可以只用 value
 * @param onChange
 * @param props
 * @constructor
 */
export const StringArray: React.FC<IStringArrayProps> = ({ mode, items, onChange, ...props }) => {
  const [inputVisible, setInputVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const parsedItems = parseArray(items) ?? [];
  const func = {
    add: (item = '') => onChange([...parsedItems, item]),
    remove: (index) => onChange(_.remove(parsedItems, (item, i) => i !== index)),
    showInput: () => setInputVisible(true),
    handleInputChange: (e) => setInputValue(e.target.value),
    handleInputConfirm: (e) => {
      if (_.trim(e.target.value)) {
        func.add(e.target.value);
      }
      setInputVisible(false);
      setInputValue('');
    },
    move(index: number, move: number) {
      const item = parsedItems[index];
      const next = parsedItems[index + move];
      parsedItems[index] = next;
      parsedItems[index + move] = item;
      onChange([...parsedItems]);
    },
  };

  useLogger('StringArray', { mode, items, parsedItems, inputVisible, inputValue }, props);

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
              // onComplete: (e) => _.set(e.target, 'style', ''),
            }}
            leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }}
            appear={false}
          >
            {_.map(parsedItems, (item, index) => (
              <span key={`${index}-${item}`} style={{ display: 'inline-block' }}>
                <Tag color="blue" closable onClose={() => func.remove(index)}>
                  {index !== 0 && (
                    <Button size="small" type="link" onClick={() => func.move(index, -1)}>
                      {'<'}
                    </Button>
                  )}
                  {item}
                  {index !== items.length - 1 && (
                    <Button size="small" type="link" onClick={() => func.move(index, +1)}>
                      {'>'}
                    </Button>
                  )}
                </Tag>
              </span>
            ))}
          </TweenOneGroup>
        </div>
        {inputVisible ? (
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
        ) : (
          <Tag onClick={func.showInput} style={{ background: '#fff', borderStyle: 'dashed' }}>
            <PlusOutlined /> 添加
          </Tag>
        )}
      </div>
    );
  }

  return (
    <>
      {_.map(parsedItems, (item, index) => (
        <React.Fragment key={index}>
          <Input
            value={item}
            onChange={(e) => {
              _.set(parsedItems, index, e.target.value);
              // parsedItems[index] = e.target.value;
              onChange(parsedItems);
            }}
            addonAfter={<CloseOutlined onClick={() => func.remove(index)} />}
          />
          <Divider dashed style={{ margin: '.1rem' }} />
        </React.Fragment>
      ))}
      <Button type="primary" onClick={() => func.add()}>
        Add
      </Button>
    </>
  );
};
