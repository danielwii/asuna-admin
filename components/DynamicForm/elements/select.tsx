import React from 'react';
import * as R from 'ramda';
import * as _ from 'lodash';

import { Select } from 'antd';

import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';

import { generateComponent } from '.';
import { createLogger, lv } from '../../../helpers/index';

const logger = createLogger('components:dynamic-form:elements', lv.warn);

interface IMixedSelectProps {
  value?: number | string | any[];
  onChange?: (selectedItems: number | string | any[]) => void;
}

interface IMixedSelectState {
  selectedItems: number | string | any[];
}

type SelectOptions = {
  key: string;
  name: string;
  label: string;
  placeholder: string;
  items: (object & { id: string | number })[];
  mode: 'default' | 'multiple' | 'tags' | 'combobox';
  getName: () => string;
  getValue: () => string;
  withSortTree: boolean;
  enumSelector: { name?: string; value?: string };
};

const defaultFormItemLayout = {};

export const generateSelect = (
  form,
  {
    key,
    name,
    label,
    placeholder,
    items,
    mode,
    getName = R.prop('name'),
    getValue = R.prop('value'),
    withSortTree = false,
    enumSelector = {},
  }: SelectOptions,
  formItemLayout = defaultFormItemLayout,
) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.info('[generateSelect]', { items, enumSelector });

  class MixedSelect extends React.Component<IMixedSelectProps, IMixedSelectState> {
    constructor(props) {
      super(props);

      logger.info('[MixedSelect]', '[constructor]', this.props);
      this.state = {
        selectedItems: this.props.value || [],
      };
    }

    onSortEnd = ({ oldIndex, newIndex }) => {
      const { onChange } = this.props;
      const selectedItems = arrayMove(this.state.selectedItems, oldIndex, newIndex);
      onChange!(selectedItems);
      this.setState({ selectedItems });
    };

    extractName = item => {
      if (enumSelector.name) {
        return R.compose(
          enumSelector.name,
          getValue,
        )(item);
      } else if (_.isArray(getValue(item))) {
        return R.compose(
          R.prop(1),
          getValue,
        )(item);
      }
      return getName(item);
    };

    extractValue = item => {
      if (enumSelector.value) {
        return R.compose(
          enumSelector.value,
          getValue,
        )(item);
      } else if (_.isArray(getValue(item))) {
        return R.compose(
          R.prop(0),
          getValue,
        )(item);
      }
      return getValue(item);
    };

    renderSortTree = () => {
      const { selectedItems } = this.state;
      const SortableItem = SortableElement(({ value, sortIndex }) => {
        const item = items.find(current => current.id === value);
        const optionName = this.extractName(item);
        const optionValue = this.extractValue(item);
        return (
          <React.Fragment>
            <li>
              <span className="sort-index">No. {sortIndex}</span>
              <span>
                {'#'}
                {optionValue}
                {': '}
                {optionName}
              </span>
            </li>
            {/* language=CSS */}
            <style jsx>{`
              li {
                position: relative;
                display: block;
                padding: 0.5rem 0.5rem 0.5rem 3.5rem;
                margin: 0.5rem 0;
                /*height: 2rem;*/
                line-height: 1rem;
                color: #000;
                text-decoration: none;
                border-radius: 0.2rem;
                transition: all 0.1s ease-out;
                box-shadow: 0 0 0.5rem grey;
              }

              li .sort-index {
                position: absolute;
                left: -1.3rem;
                /*top: 50%;*/
                top: 1rem;
                margin-top: -1.3rem;
                width: 4rem;
                line-height: 2rem;
                border: 0.3rem solid #fff;
                text-align: center;
                border-radius: 0.2rem;
                background-color: white;
                box-shadow: 0 0 0.5rem grey;
              }

              li:hover {
                background: #d6d4d4;
                text-decoration: none;
                transform: scale(1.02);
              }
            `}</style>
          </React.Fragment>
        );
      });
      const SortableList = SortableContainer(({ selectedSortedItems }) => (
        <ul>
          {selectedSortedItems.map((value, index) => (
            <SortableItem
              key={`item-${Symbol(index).toString()}`}
              index={index}
              sortIndex={index}
              value={value}
            />
          ))}
          {/* language=CSS */}
          <style jsx>{`
            ul {
              list-style: none;
              padding: 0;
              margin: 2rem;
            }
          `}</style>
        </ul>
      ));

      return <SortableList selectedSortedItems={selectedItems} onSortEnd={this.onSortEnd} />;
    };

    render() {
      logger.info('[MixedSelect]', '[render]', { state: this.state, props: this.props });
      return (
        <React.Fragment>
          <Select
            {...this.props}
            value={this.props.value || []} // value 为 null 时会显示一个空白框
            key={fieldName}
            showSearch
            allowClear
            // style={{ width: 300 }}
            placeholder={placeholder}
            optionFilterProp="items"
            mode={mode}
            filterOption={(input, option) => {
              logger.log('filter item is', { input, option });
              const itemStr = R.join('', option.props.children).toLowerCase();
              return itemStr.indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {(items || []).map(item => {
              const optionName = this.extractName(item);
              const optionValue = this.extractValue(item);
              return (
                <Select.Option key={optionValue} value={optionValue}>
                  {'#'}
                  {optionValue}
                  {': '}
                  {optionName}
                </Select.Option>
              );
            })}
          </Select>
          {withSortTree && this.renderSortTree()}
        </React.Fragment>
      );
    }
  }

  return generateComponent(form, { fieldName, labelName }, <MixedSelect />, formItemLayout);
};
