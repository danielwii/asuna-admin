import join from 'url-join';

/**
 * 上传组件会返回一个 UploadResponse，包含必要的信息
 * @param res
 */
export function responseToUrl(res: Asuna.Schema.UploadResponse) {
  return join(res.bucket, res.prefix, res.filename);
}
