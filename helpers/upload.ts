// --------------------------------------------------------------
// 上传组件会返回一个 UploadResponse，包含必要的信息
// --------------------------------------------------------------

import { join } from 'path';

import { config, ConfigKey } from '../app/configure';
import { createLogger, lv } from './logger';

const logger = createLogger('helpers', lv.warn);

export function imageResToUrl(res: Asuna.Schema.UploadResponse) {
  const api = config.get(ConfigKey.IMAGE_API);
  return join(api, res.prefix, res.filename);
}

export function videoResToUrl(res: Asuna.Schema.UploadResponse) {
  const api = config.get(ConfigKey.VIDEO_API);
  return join(api, res.prefix, res.filename);
}
