import { apiProxy } from '@asuna-admin/adapters';
import { createLogger } from '@asuna-admin/logger';
import { Asuna } from '@asuna-admin/types';

import { message } from 'antd';
import { AxiosRequestConfig } from 'axios';

const logger = createLogger('helpers:upload');

export async function getBase64(image): Promise<string | ArrayBuffer | null> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.addEventListener('load', () => (reader.result ? resolve(reader.result) : resolve(null)));
    reader.addEventListener('error', (ev) => reject(ev));
    reader.readAsDataURL(image);
  });
}

export function validateFile(file: { type: string; size: number }): boolean {
  logger.log('validate file', file);
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
  const isVideo = ['video/mp4'].includes(file.type);
  const isLt20M = file.size / 1024 / 1024 < 20;
  const isLt1000M = file.size / 1024 / 1024 < 1000;
  logger.log('[validateFile]', file, { isImage, isVideo, isLt1000M });

  if (isImage) {
    if (!isLt20M) {
      message.error('Image must smaller than 20MB!');
      return false;
    }
    return true;
  }

  if (isVideo) {
    if (!isLt1000M) {
      message.error('Video must smaller than 1000MB!');
      return false;
    }
    return true;
  }

  message.error('You can only upload JPG/PNG/GIF or MP4 file!');
  return false;
}

export async function upload(
  file: object,
  requestConfig?: AxiosRequestConfig,
  opts: { bucket?: string; prefix?: string } = {},
): Promise<Asuna.Schema.UploadResponse[] | undefined> {
  logger.log('[upload]', { file, opts });
  const response = await apiProxy.upload(file, opts, requestConfig);
  logger.log('[upload]', { response });

  return new Promise((resolve, reject) => {
    if (/^20\d$/.test(response.status as any)) {
      message.success('upload successfully.');
      resolve(response.data);
    } else {
      message.error('upload failed.');
      reject(response);
    }
  });
}
