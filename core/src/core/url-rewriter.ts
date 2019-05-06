import * as _ from 'lodash';
import { isJson } from '@asuna-admin/helpers';
import { createLogger } from '@asuna-admin/logger';
import { Config } from '@asuna-admin/config';
import { AppContext } from '.';

const logger = createLogger('core:url-rewriter');

export function valueToArrays(value) {
  const castToArrays = value =>
    isJson(value) ? JSON.parse(value as string) : _.compact(value.split(','));
  const images = value ? (_.isArray(value) ? value : castToArrays(value)) : [];
  logger.debug('[valueToArrays]', { value, images });
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
    type?: 'image' | 'video' | 'attache' | 'file';
    thumbnail?: { width?: number; height?: number };
  },
) {
  if (value) {
    const hostPrefix =
      host ||
      _.cond([
        [_.matches('image'), _.constant(Config.get('IMAGE_HOST'))],
        [_.matches('video'), _.constant(Config.get('VIDEO_HOST'))],
        [_.matches('attache'), _.constant(Config.get('ATTACHE_HOST'))],
        [_.matches('file'), _.constant(Config.get('FILE_HOST'))],
      ])(type) ||
      '';
    let url = hostPrefix + `/${value}`.replace('//', '/').slice(1);
    if (thumbnail) {
      const template = _.get(AppContext.serverSettings['settings.url-resolver'], 'value.uploads');
      try {
        url = template.replace('{{ url }}', url);
      } catch (e) {
        logger.warn('using template error', { template, url });
      }
      // url += `?imageView2/2/w/${thumbnail.width || 1280}/h/${thumbnail.height ||
      //   1280}/format/jpg/interlace/1/ignore-error/1`;
    }
    logger.debug('[valueToUrl]', { value, url, host });
    return url;
  }
  return '';
}
