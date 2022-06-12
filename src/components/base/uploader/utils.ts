import { message } from 'antd';
import axios, { AxiosRequestConfig } from 'axios';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';

import { castToArrays } from '../helper/helper';

import type { IUploadedFile, UploaderAdapter } from './uploader';
import type { UploadFile, UploadFileStatus } from 'antd/es/upload/interface';

export function wrapFilesToFileList(value: string | string[]): UploadFile[] {
  const files = valueToArray(value);
  const fileList = _.flow([
    fp.filter<string>((file) => typeof file !== 'object'),
    fp.uniq,
    fp.map<string, Partial<UploadFile>>((file) => ({
      uid: `${file}`,
      status: 'done' as UploadFileStatus,
      name: file,
      url: file,
      // size: option?.file.size || 0,
      // type: option?.file.type || '',
      // thumbUrl: valueToUrl(video, { type: 'video' }),
    })),
  ])(files);
  // console.log('[wrapFilesToFileList]', value);
  // console.table(fileList);
  return fileList;
}

export function valueToArray(value: string | string[]): string[] {
  if (_.isArray(value)) {
    return value;
  }
  return castToArrays(value);
}

export function valueToString(value: string | string[], multiple: boolean, jsonMode: boolean): string | string[] {
  if (multiple) {
    if (_.isArray(value)) {
      if (jsonMode) {
        return value;
      }
      return value.join(',');
    }
    return value;
  } else {
    if (_.isArray(value)) {
      if (jsonMode) {
        return _.tail(value);
      }
      return _.last(value) as string;
    }
    return value;
  }
}

export class DefaultFileUploaderAdapterImpl implements UploaderAdapter {
  constructor(protected readonly host: string = '', private readonly config: AxiosRequestConfig = {}) {}

  upload(file: File, requestConfig?: AxiosRequestConfig): Promise<IUploadedFile[]> {
    const instance = axios.create({ baseURL: this.host, timeout: 60e3 });
    const url = 'api/v1/uploader';
    const config: AxiosRequestConfig = {
      headers: { 'content-type': 'multipart/form-data' },
      ...(requestConfig ?? {}),
      ...this.config,
    };
    const data = new FormData();
    data.append('files', file, file.name);
    return instance.post<IUploadedFile[]>(url, data, config).then((res) => res.data);
  }

  validate(file: File): boolean {
    const maxSize = 20;
    const supported = ['image/jpeg', 'image/png', 'image/gif'];
    const isImage = supported.includes(file.type);

    const size = file.size / 1024 / 1024;
    if (size > maxSize) {
      message.error(`上传的文件不能超过 ${size}/${maxSize}mb`);
      return false;
    }
    if (!isImage) {
      message.error(`${file.type} 格式不正确，仅支持: ${supported}`);
      return false;
    }
    return true;
  }
}

function loadImageAsync(url: string, context: any): Promise<void> {
  const { formData } = context.props;
  return new Promise((resolve, reject) => {
    const newImage = new Image();
    newImage.src = url;
    newImage.onload = () => {
      const imgInfo = {
        height: newImage.height,
        width: newImage.width,
      };
      if (formData.width || formData.height) {
        context.setState({
          data: {
            ...context.data,
            width: imgInfo.width,
            height: imgInfo.height,
          },
        });
      }
      context.imgInfo = imgInfo;
      if (formData.maxHeight && formData.maxWidth) {
        // 判断最大高宽双条件
        if (imgInfo.height > formData.maxHeight || imgInfo.width > formData.maxWidth) {
          message.error(`图片尺寸限制为最大宽度${formData.maxWidth}, 最大高度${formData.maxHeight}，请重新上传`);
          reject();
          return;
        }
      }
      if (formData.maxHeight || formData.maxWidth) {
        // 判断最大高宽单条件
        if (formData.maxHeight && formData.maxHeight < imgInfo.height) {
          message.error(`图片尺寸限制最大高度${formData.maxHeight}，请重新上传`);
          reject();
          return;
        } else if (formData.maxWidth && formData.maxWidth < imgInfo.width) {
          message.error(`图片尺寸限制最大宽度${formData.maxWidth}，请重新上传`);
          reject();
          return;
        }
      }
      if (formData.minHeight || formData.minWidth) {
        // 判断最小高宽单条件
        if (formData.minHeight && formData.minHeight > imgInfo.height) {
          message.error(`图片尺寸限制最小高度${formData.minHeight}，请重新上传`);
          reject();
          return;
        } else if (formData.minWidth && formData.minWidth < imgInfo.width) {
          message.error(`图片尺寸限制最小宽度${formData.minWidth}，请重新上传`);
          reject();
          return;
        }
      }
      if (formData.height && formData.width) {
        // 判断高宽双条件
        if (formData.height === imgInfo.height && formData.width === imgInfo.width) {
          resolve();
        } else {
          message.error(`图片尺寸限制为${formData.width}*${formData.height}，请重新上传`);
          reject();
          return;
        }
      } else if (formData.height || formData.width) {
        // 判断高宽单条件
        if (formData.height && formData.height !== imgInfo.height) {
          message.error(`图片尺寸限制高度${formData.height}，请重新上传`);
          reject();
        } else if (formData.width && formData.width !== imgInfo.width) {
          message.error(`图片尺寸限制宽度${formData.width}，请重新上传`);
          reject();
          return;
        }
      }
      resolve();
    };
  });
}
export function loadReaderAsync(evt: File, context: any): Promise<void> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (src: any) => {
      resolve(loadImageAsync(src.target.result, context));
    };
    reader.readAsDataURL(evt);
  });
}
