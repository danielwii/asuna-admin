import * as _ from 'lodash';
import { isJson } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Config } from '@asuna-admin/config';

const logger = createLogger('core:url-rewriter');

export function valueToImages(value) {
  const castToArrays = value =>
    isJson(value) ? JSON.parse(value as string) : _.compact(value.split(','));
  const images = value ? (_.isArray(value) ? value : castToArrays(value)) : [];
  logger.debug('[valueToImages]', { value, images });
  return images;
}

export function valueToUrl(
  value,
  {
    host,
    type,
    thumbnail,
  }: {
    host?: string;
    type?: 'image' | 'video' | 'attaches';
    thumbnail?: { width?: number; height?: number };
  },
) {
  if (value) {
    const hostPrefix =
      host ||
      _.cond([
        [_.matches('image'), _.constant(Config.get('IMAGE_HOST'))],
        [_.matches('video'), _.constant(Config.get('VIDEO_HOST'))],
        [_.matches('attaches'), _.constant(Config.get('ATTACHES_HOST'))],
      ])(type) ||
      '';
    let url = hostPrefix + `/${value}`.replace('//', '/').slice(1);
    if (thumbnail) {
      // TODO using qiniu here temporarily, update to dynamic later
      url += `?imageView2/2/w/${thumbnail.width || 1280}/h/${thumbnail.height ||
        1280}/format/jpg/interlace/1/ignore-error/1`;
    }
    logger.debug('[valueToUrl]', { value, url, host });
    return url;
  }
  return '';
}
