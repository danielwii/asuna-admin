import { WithVariable } from '@asuna-admin/components/Common';
import { Config } from '@asuna-admin/config';
import { upload, validateFile } from '@asuna-admin/helpers/upload';
import { createLogger } from '@asuna-admin/logger';

import { WrappedFormUtils } from '@ant-design/compatible/es/form/Form';
import { IUploadedFile, IUploaderProps, Uploader, UploaderAdapter } from 'asuna-components';
import { AxiosRequestConfig } from 'axios';
import * as React from 'react';
import { useLogger } from 'react-use';

import { generateComponent, horizontalFormItemLayout, IFormItemLayout } from '.';
import { ImageTrivia } from '../ImageTrivia';
import { FormComponentProps } from './interfaces';

const logger = createLogger('components:dynamic-form:image');

const UploaderHOC: React.FC<Partial<FormComponentProps> & Partial<IUploaderProps>> = (props) => {
  useLogger(`Images(key=${name})`, props);
  return (
    <WithVariable key={props.id} variable={props as FormComponentProps & Partial<IUploaderProps>}>
      {(props) => {
        useLogger('generateImages', { props });
        return <Uploader adapter={new FileUploaderAdapterImpl()} {...props} />;
      }}
    </WithVariable>
  );
};

export const generateImages = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');

  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    // TODO jsonMode need to setup dynamically later
    // <ImageUploader key={fieldName} many={true} urlHandler={handler} jsonMode />,
    <UploaderHOC multiple jsonMode />,
    formItemLayout,
  );
};

export class FileUploaderAdapterImpl implements UploaderAdapter {
  upload(
    file: File,
    extra?: { params?: { bucket: string }; requestConfig?: AxiosRequestConfig },
  ): Promise<IUploadedFile[]> {
    return upload(file, extra?.requestConfig, extra?.params) as any;
  }

  validate(file: File): boolean {
    return validateFile(file);
  }
}

export const generateImage = (
  form: WrappedFormUtils,
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) => {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');
  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <UploaderHOC />,
    // <ImageUploader key={fieldName} many={false} urlHandler={handler} />,
    formItemLayout,
  );
};

export function generateRichImage(
  form: WrappedFormUtils,
  fields: FormField[],
  options,
  formItemLayout: IFormItemLayout = horizontalFormItemLayout,
) {
  const { key, name, label } = options;

  const fieldName = key || name;
  const labelName = label || name || key;
  // const host = Config.get('IMAGE_HOST');
  const handler = Config.get('IMAGE_RES_HANDLER');

  logger.log('[generateRichImage]', { fields, options });

  return generateComponent(
    form,
    { fieldName, labelName, ...options },
    <ImageTrivia urlHandler={handler} />,
    formItemLayout,
  );
}
