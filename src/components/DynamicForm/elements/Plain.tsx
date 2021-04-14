import { Form } from '@ant-design/compatible';

import { AssetPreview } from 'asuna-components';
import * as _ from 'lodash';
import * as React from 'react';

import { horizontalFormItemLayout, IFormItemLayout, PlainOptions } from '.';
import { createLogger } from '../../../logger';

const logger = createLogger('components:dynamic-form:elements:plain');

interface IPlainImagesProps {
  options: PlainOptions;
  formItemLayout?: IFormItemLayout;
}

export function PlainImages({ options, formItemLayout }: IPlainImagesProps) {
  const { key, label, text, help, name } = options;
  logger.log('[PlainImages]', { options });
  const fieldName = key || name;
  const labelName = label || name || key;
  const assets = _.isArray(text) ? text : _.isString(text) ? text.split(',') : text;
  // const host = Config.get('UPLOADS_ENDPOINT', '');
  return (
    <Form.Item key={fieldName} {...(formItemLayout || horizontalFormItemLayout)} label={labelName} help={help}>
      {_.map(assets, (asset) => (
        <AssetPreview key={asset} url={asset} showPdf fullWidth />
      ))}
    </Form.Item>
  );
}
