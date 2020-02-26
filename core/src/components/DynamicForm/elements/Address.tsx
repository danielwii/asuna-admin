import { ChinaDivisionOptions, parseAddress } from '@asuna-admin/components';
import { Cascader, Input } from 'antd';
import { WrappedFormUtils } from 'antd/es/form/Form';
import * as React from 'react';
import { generateComponent, horizontalFormItemLayout, IFormItemLayout, InputOptions } from '.';
import { FormComponentProps } from './interfaces';

class AddressInline extends React.Component<Partial<FormComponentProps> & { placeholder: string }> {
  _onChange(codes: string[] | undefined, labels: string[] | undefined, detail: string | null): void {
    const { onChange } = this.props;
    onChange!(JSON.stringify([codes?.join(','), labels?.join(','), detail || '']));
  }

  render() {
    const { codes, labels, detail } = parseAddress(this.props.value);
    // console.log('render', { codes, labels, detail });

    return (
      <>
        <Cascader
          options={ChinaDivisionOptions}
          placeholder="选择市区"
          onChange={(value, selectedOptions) => {
            // console.log('select', { value, selectedOptions });
            this._onChange(
              value,
              selectedOptions?.map(option => option.label as string),
              detail,
            );
          }}
          defaultValue={codes}
        />
        <Input
          allowClear
          {...this.props}
          value={detail}
          onChange={event => {
            // console.log('input', event.target.value, { codes, labels });
            this._onChange(codes, labels, event.target.value);
          }}
        />
      </>
    );
  }
}

export const generateAddress = (
  form: WrappedFormUtils,
  { key, name, label, required = false, requiredMessage, placeholder = '', iconType, help, length }: InputOptions,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const fieldName = key || name;
  const labelName = label || name || key;

  return generateComponent(
    form,
    {
      key,
      name,
      label,
      fieldName,
      labelName,
      opts: { rules: [{ required, message: requiredMessage }, { max: length }] },
      help,
    },
    <AddressInline placeholder={placeholder || '详细地址'} />,
    formItemLayout,
  );
};
