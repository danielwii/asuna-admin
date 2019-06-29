import { message } from 'antd';
import { apiProxy } from '@asuna-admin/adapters';
import { createLogger } from '@asuna-admin/logger';
import { AxiosRequestConfig } from 'axios';

const logger = createLogger('helpers:upload');

export async function getBase64(image): Promise<string | ArrayBuffer | null> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.addEventListener('load', () => (reader.result ? resolve(reader.result) : resolve()));
    reader.addEventListener('error', ev => reject(ev));
    reader.readAsDataURL(image);
  });
}

export function validateFile(file: { type: string; size: number }): boolean {
  // console.log(file);
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].indexOf(file.type) > -1;
  const isLt20M = file.size / 1024 / 1024 < 20;
  logger.log('[validateFile]', file, { isImage, isLt20M });
  if (!isImage) {
    message.error('You can only upload JPG/PNG/GIF file!');
  }
  if (!isLt20M) {
    message.error('Image must smaller than 20MB!');
  }
  return isImage && isLt20M;
}

export async function upload(
  file: object,
  requestConfig?: AxiosRequestConfig,
  opts: { bucket?: string } = {},
): Promise<Asuna.Schema.UploadResponse[] | undefined> {
  logger.log('[upload]', { file });
  const response = await apiProxy.upload(file, {}, requestConfig);
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
