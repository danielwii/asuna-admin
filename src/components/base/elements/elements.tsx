import { Input, Tag } from 'antd';
import React from 'react';

import { isJson } from '../helper/helper';

import type { TextAreaProps } from 'antd/es/input';

export const AsunaTextArea: React.FC<
  { value: string; onChange: (value: string) => any } & Omit<TextAreaProps, 'onChange'>
> = ({ value, onChange, ...props }) => {
  const isJsonValue = React.useMemo<boolean>(() => isJson(value), [value]);
  return (
    <>
      <Input.TextArea {...props} autoSize rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      {isJsonValue && <Tag color="success">JSON</Tag>}
    </>
  );
};
