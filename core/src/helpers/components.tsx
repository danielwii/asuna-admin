/** @jsx jsx */
import { useQuery } from '@apollo/react-hooks';
import { AsunaDrawerButton, RoundWrapper, ThumbImage, WithVariable } from '@asuna-admin/components';
import { valueToUrl } from '@asuna-admin/core';
import { AppContext } from '@asuna-admin/core/context';
import { createLogger } from '@asuna-admin/logger';
import { css, jsx } from '@emotion/core';
import { createStyles, Theme } from '@material-ui/core';
import { gql } from 'apollo-boost';
import { WithFuture } from 'asuna-components';
import * as React from 'react';

const logger = createLogger('components:helper');

export const ComponentsHelper = {
  styles: (theme: Theme) =>
    createStyles({
      root: { flexGrow: 1, margin: '.1rem' },
      container: { display: 'flex', flexWrap: 'wrap' },
      textField: { width: 300 },
      fullwidthTextField: {},
      button: {},
      margin: { margin: theme.spacing(1) },
      menu: { width: 200 },
    }),
  renderDrawerButton: <T extends any>({
    getModel,
    getPortrait,
    modelName,
    getTitle,
    getText,
    getExtra,
    future,
  }: {
    getModel: (profile) => T | undefined | null;
    getPortrait?: (info: T) => React.ReactNode;
    modelName: string;
    getTitle?: (info) => T | React.ReactNode;
    getText: (info: T) => React.ReactNode;
    getExtra?: (info: T) => React.ReactNode;
    future: Promise<any>;
  }): React.ReactElement => (
    <WithFuture future={() => future}>
      {result => (
        <WithVariable variable={getModel(result)}>
          {info => (
            <div
              css={css`
                display: flex;
                align-items: center;
                > div {
                  padding: 0 0.5rem;
                }
              `}
            >
              {getPortrait && (
                <WithVariable variable={getPortrait(info)}>
                  {portrait => (
                    <RoundWrapper>
                      <ThumbImage
                        height={50}
                        width={50}
                        src={valueToUrl(portrait, { type: 'image', thumbnail: { height: 100, width: 100 } })}
                      />
                    </RoundWrapper>
                  )}
                </WithVariable>
              )}
              <div>
                {getTitle && (
                  <React.Fragment>
                    <b>{getTitle(info)}</b>
                    <br />
                  </React.Fragment>
                )}
                <AsunaDrawerButton text={getText(info)} modelName={modelName} record={info as any} />
                {getExtra && (
                  <React.Fragment>
                    <br />
                    {getExtra(info)}
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
        </WithVariable>
      )}
    </WithFuture>
  ),
};

export const KVHelper = {
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
          collection
          key
          updatedAt
          name
          value
        }
      }
    `,
      { fetchPolicy: 'network-only' },
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
