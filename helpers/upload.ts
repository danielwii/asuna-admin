// --------------------------------------------------------------
// 上传组件会返回一个 UploadResponse，包含必要的信息
// --------------------------------------------------------------

import { join } from 'path';
import { createLogger, lv } from './logger';

const logger = createLogger('helpers', lv.warn);

export function responseToUrl(res: Asuna.Schema.UploadResponse) {
  return join(res.prefix, res.filename);
}
