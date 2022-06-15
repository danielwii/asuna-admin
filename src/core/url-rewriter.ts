import * as _ from 'lodash';

import { isJson } from '../components/base/helper/helper';
import { createLogger } from '../logger';
// import { AppContext } from './context';

const logger = createLogger('core:url-rewriter');

const castToArrays = (value) => (isJson(value) ? JSON.parse(value as string) : _.compact(value.split(',')));

export function valueToArrays(value): any[] {
  const array = value ? (_.isArray(value) ? value : castToArrays(value)) : [];
  logger.debug('[valueToArrays]', { value, array });
  return array;
}

export function joinUrl(base?: string, path?: string): string {
  if (path && path.startsWith('http')) {
    return path;
  }
  const safeBase = base || '';
  const endpoint = safeBase.endsWith('/') ? safeBase : `${safeBase}/`;
  return endpoint + `/${path || ''}`.replace('//', '/').slice(1);
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
    // const base = host || Config.get('UPLOADS_ENDPOINT') || '';
    // let url = joinUrl(base, value);
    // response value param fullpath already includes uploads path

    let url = value;
    if (thumbnail) {
      // const template = _.get(AppContext.serverSettings?.['settings.url-resolver'], 'value.uploads', '');
      // if (!(_.isString(template) && template.includes('{{ url }}'))) {
      //   logger.log('template for settings.url-resolver/value.uploads dose not exists or valid.');
      //   return url;
      // }
      // try {
      //   url = template.replace('{{ url }}', url);
      // } catch (e) {
      //   logger.warn('using template error', { template, url });
      // }
      // url += `?imageView2/2/w/${thumbnail.width || 1280}/h/${thumbnail.height ||
      //   1280}/format/jpg/interlace/1/ignore-error/1`;
    }
    logger.debug('[valueToUrl]', { value, url, host });
    return url;
  }
  return '';
}
