/* eslint-disable indent,function-paren-newline */
import React  from 'react';
import * as R from 'ramda';

import PropTypes from 'prop-types';

import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Select }            from 'antd';
import { generateComponent } from '.';

import { createLogger } from '../../../adapters/logger';

const logger = createLogger('components:dynamic-form:elements');

const defaultFormItemLayout = {};

// eslint-disable-next-line import/prefer-default-export
export const generateSelect = (form, {
  key, name, label, placeholder, items, mode,
  getName = R.prop('name'), getValue = R.prop('value'),
  withSortTree = false,
}, formItemLayout = defaultFormItemLayout) => {
  const fieldName = key || name;
  const labelName = label || name || key;
  logger.info('[generateSelect]', 'items is', items);

  class MixedSelect extends React.Component {
    static propTypes = {
      value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.any),
      ]),
    };

    constructor(props) {
      super(props);

      logger.info('[MixedSelect]', '[constructor]', this.props);
      this.state = {
        selectedItems: this.props.value || [],
      };
    }

    onSortEnd      = ({ oldIndex, newIndex }) => {
      this.setState({
        selectedItems: arrayMove(this.state.selectedItems, oldIndex, newIndex),
      });
    };
    renderSortTree = () => {
      const { selectedItems } = this.state;
      const SortableItem      = SortableElement(({ value, sortIndex }) =>
        (<React.Fragment>
          <li><span className="sort-index">#{' '}{sortIndex}</span>{value}</li>
          {/* language=CSS */}
          <style jsx>{`
            li {
              position: relative;
              display: block;
              padding: .4rem .4rem .4rem 2.5rem;
              margin: .5rem 0;
              background: #93C775;
              height: 2rem;
              line-height: 1rem;
              color: #000;
              text-decoration: none;
              border-radius: 10rem;
              transition: all .1s ease-out;
            }

            li .sort-index {
              position: absolute;
              left: -1.3rem;
              top: 50%;
              margin-top: -1.3rem;
              background: #93C775;
              /*height: 2rem;*/
              width: 3rem;
              line-height: 2rem;
              border: .3rem solid #fff;
              text-align: center;
              font-weight: bold;
              border-radius: 2rem;
              color: #FFF;
            }

            li:hover {
              background: #d6d4d4;
              text-decoration: none;
              transform: scale(1.02);
            }
          `}</style>
        </React.Fragment>),
      );
      const SortableList      = SortableContainer(({ selectedSortedItems }) => (
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
            style={{ width: 200 }}
            placeholder={placeholder}
            optionFilterProp="items"
            mode={mode}
            filterOption={(input, option) => {
              logger.log('filter item is', { input, option });
              const itemStr = R.join('', option.props.children).toLowerCase();
              return itemStr.indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {(items || []).map(item => (
              <Select.Option
                key={getValue(item)}
                value={getValue(item)}
              >{'#'}{getValue(item)}{': '}{getName(item)}</Select.Option>
            ))}
          </Select>
          {withSortTree && this.renderSortTree()}
        </React.Fragment>
      );
    }
  }

  return generateComponent(
    form, { fieldName, labelName }, (<MixedSelect />), formItemLayout,
  );
};
