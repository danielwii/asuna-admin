import { AppContext } from '@asuna-admin/core/context';
import { createLogger } from '@asuna-admin/logger';
import { createStyles, Theme } from '@material-ui/core';
import { gql } from 'apollo-boost';
import * as React from 'react';
import { useQuery } from '@apollo/react-hooks';

const logger = createLogger('components:helper');

export const ComponentsHelper = {
  styles: (theme: Theme) =>
    createStyles({
      root: {
        flexGrow: 1,
        margin: '.1rem',
      },
      container: {
        display: 'flex',
        flexWrap: 'wrap',
      },
      textField: { width: 300 },
      fullwidthTextField: {},
      button: {},
      margin: {
        margin: theme.spacing(1),
      },
      menu: { width: 200 },
    }),
  loadByKey: (key: string, collection: string = 'system.server') =>
    useQuery(
      gql`
      {
        kv(collection: "${collection}", key: "${key}") {
          updatedAt
          name
          value
        }
      }
    `,
      { fetchPolicy: 'no-cache' },
    ),
  save: (identifier: { key: string; collection?: string }, body: any, cb?): Promise<any> => {
    logger.log('save', { identifier, body });
    return AppContext.adapters.models
      .upsert('kv__pairs', {
        body: { collection: identifier.collection || 'system.server', key: identifier.key, value: body },
      })
      .then(response => (cb ? cb(response.data) : response.data))
      .catch(reason => logger.error(reason));
  },
  clear: (identifier: { key: string; collection?: string }, cb?): Promise<any> => {
    logger.log('clear', { identifier });
    return AppContext.adapters.models
      .upsert('kv__pairs', {
        body: { collection: identifier.collection || 'system.server', key: identifier.key, value: null },
      })
      .then(response => (cb ? cb(response.data) : response.data))
      .catch(reason => logger.error(reason));
  },
  destroy: (identifier: { key: string; collection?: string }, cb?): Promise<any> => {
    logger.log('clear', { identifier });
    return AppContext.adapters.api
      .destroyKv({ collection: identifier.collection || 'system.server', key: identifier.key } as any)
      .then(response => (cb ? cb(response.data) : response.data))
      .catch(reason => logger.error(reason));
  },
};
