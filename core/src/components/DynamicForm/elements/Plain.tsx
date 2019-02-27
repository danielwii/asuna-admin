import { horizontalFormItemLayout, IFormItemLayout, PlainOptions } from '.';
import { Form } from 'antd';
import React from 'react';
import * as _ from 'lodash';
import { createLogger } from '@asuna-admin/logger';
import { FluxCenterBox, ThumbImage } from '@asuna-admin/components';
import { Config } from '@asuna-admin/config';

const logger = createLogger('components:dynamic-form:elements:plain');

interface IPlainImagesProps {
  options: PlainOptions;
  formItemLayout?: IFormItemLayout;
}

export function PlainImages({ options, formItemLayout }: IPlainImagesProps) {
  const { key, label, text, help } = options;
  logger.log('[PlainImages]', { options });
  const fieldName = key || name;
  const labelName = label || name || key;
  const assets = _.isArray(text) ? text : _.isString(text) ? text.split(',') : text;
  const host = Config.get('IMAGE_HOST') || '';
  return (
    <Form.Item
      key={fieldName}
      {...formItemLayout || horizontalFormItemLayout}
      label={labelName}
      help={help}
    >
      {_.map(assets, asset => (
        <FluxCenterBox key={asset}>
          <a href={`${host}${asset}`} target="_blank">
            <ThumbImage
              width="100%"
              src={`${host}${asset}?imageView2/2/w/1280/h/1280/format/jpg/interlace/1/ignore-error/1`}
            />
          </a>
        </FluxCenterBox>
      ))}
    </Form.Item>
  );
}
