import * as React from 'react';
import { useState } from 'react';
import { Button, Icon, message, Upload } from 'antd';
import { UploadChangeParam, UploadProps } from 'antd/lib/upload';
import { UploadFile, UploadFileStatus } from 'antd/es/upload/interface';
import { join } from 'path';
import * as _ from 'lodash';

import { upload } from '@asuna-admin/helpers/upload';
import { valueToArrays, valueToUrl } from '@asuna-admin/core/url-rewriter';
import { createLogger } from '@asuna-admin/logger';

const logger = createLogger('components:dynamic-form:files');

export interface IFilesUploaderProps {
  host?: string;
  prefix?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: string | string[];
  onChange?: (value: any) => void;
  many?: boolean;
  fileSize?: number;
  jsonMode?: boolean;
}

interface IState {
  uploadFiles: UploadFile[];
}

const urlToUploadFile = (url, index) => ({
  uid: `${index}`,
  name: valueToUrl(url, { type: 'file' }),
  status: 'done' as UploadFileStatus,
  url: valueToUrl(url, { type: 'file' }),
  size: 0,
  type: '',
});

export const FilesUploader = (props: IFilesUploaderProps) => {
  const [state, setState] = useState<IState>({
    uploadFiles: _.isString(props.value)
      ? [urlToUploadFile(props.value, 0)]
      : (props.value || []).map(urlToUploadFile),
  });

  logger.log('render', { props, state });

  const uploadProps: UploadProps = {
    customRequest(option: {
      file: UploadFile;
      onSuccess: (response: any, file: UploadFile) => void;
      onProgress: (e: { percent: number }, file: UploadFile) => void;
      onError: (error: Error, response: any, file: UploadFile) => void;
    }) {
      logger.log('[FilesUploader][customRequest]', option);
      upload(option.file, {
        onUploadProgress: ({ total, loaded }) => {
          option.onProgress(
            { percent: +Math.round((loaded / total) * 100).toFixed(2) },
            option.file,
          );
        },
      })
        .then(uploaded => {
          logger.log('[FilesUploader][customRequest]', { uploaded });
          const { onChange, urlHandler, prefix, jsonMode } = props;
          if (uploaded) {
            logger.log('[FilesUploader][customRequest]', { props, state });
            const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
            let fileUrl = resolvedUrl;
            if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith(prefix || '')) {
              fileUrl = join(prefix || '', resolvedUrl);
            }
            logger.log('[FilesUploader][customRequest]', { file: fileUrl, prefix, resolvedUrl });
            const uploadedFiles = valueToArrays(props.value);
            logger.log(
              '[FilesUploader][customRequest]',
              { uploadedFiles, file: fileUrl },
              _.flattenDeep([uploadedFiles, fileUrl]),
            );
            // 构造一个已上传文件的列表，最新的放在最后面
            let files: string | string[] = _.compact(_.flattenDeep([uploadedFiles, fileUrl]));
            // 当当前模式是单文件上传模式时，取最后一个文件为当前文件
            files = props.many ? files : [_.last(files) || ''];
            if (!jsonMode) {
              // cast to string
              files = files.join(',');
            }
            logger.log('[FilesUploader][customRequest]', { files, uploadedFiles });
            onChange!(files);
            option.onSuccess(uploaded, option.file);
            // wrapFilesToFileList(option.file, files);
          }
        })
        .catch(reason => option.onError(reason, reason.response, option.file));
    },
    multiple: false,
    supportServerRender: true,
    onChange(info: UploadChangeParam) {
      setState({ uploadFiles: [...info.fileList] });
      if (info.file.status !== 'uploading') {
        logger.log('[FilesUploader][onChange]', info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        logger.log('[FilesUploader][onChange]', info.file, info.fileList);
        setState({
          uploadFiles: _.compact(props.many ? info.fileList : [_.last(info.fileList)]),
        });
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <Upload {...uploadProps} fileList={state.uploadFiles as UploadFile[]}>
      <Button>
        <Icon type="upload" /> Click to Upload
      </Button>
    </Upload>
  );
};
