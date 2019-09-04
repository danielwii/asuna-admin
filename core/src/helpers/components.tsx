import { AppContext } from '@asuna-admin/core/context';
import { createLogger } from '@asuna-admin/logger';
import { createStyles, Theme } from '@material-ui/core';
import { gql } from 'apollo-boost';
import * as React from 'react';
import { useQuery } from 'react-apollo-hooks';

const logger = createLogger('components:helper');

export const ComponentsHelper = {
  styles: (theme: Theme) =>
    createStyles({
      root: {
        flexGrow: 1,
        // margin: '1rem',
      },
      container: {
        display: 'flex',
        flexWrap: 'wrap',
      },
      textField: {
        width: 300,
      },
      fullwidthTextField: {},
      button: {},
      margin: {
        margin: theme.spacing(1),
      },
      menu: {
        width: 200,
      },
    }),
  loadByKey: (key: string) =>
    useQuery(
      gql`
      {
        kv(collection: "system.server", key: "${key}") {
          updatedAt
          name
          value
        }
      }
    `,
      { fetchPolicy: 'no-cache' },
    ),
  save: (key: string, state, cb) => {
    logger.log('save', state);
    AppContext.adapters.models
      .upsert('kv__pairs', {
        body: { collection: 'system.server', key, value: state.body },
      })
      .then(response => cb(response.data))
      .catch(reason => logger.error(reason));
  },
};
