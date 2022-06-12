import { gql } from '@apollo/client';

import consola from 'consola';
import _ from 'lodash';
import * as React from 'react';

import { AppContext, IComponentService } from '../core/context';

export interface IRegGraphqlProps {
  kvGql: (KVOpts: { collection: string; key: string }) => any;
}

export class ComponentService implements IComponentService {
  #components: { [key: string]: React.VFC } = {};

  reg(componentName: string, component: React.VFC): void {
    this.#components[componentName] = component;
  }

  regGraphql(componentName: string, renderComponent: React.VFC): void {
    consola.info('reg graphql component', { componentName, client: _.get(AppContext.ctx, 'graphql.client') });
    this.#components[componentName] = (props) =>
      // <ApolloProvider client={AppContext.ctx.graphql.client as any /* TODO error occurred */}>
      //   {
      renderComponent({
        ...props,
        kvGql: (KVOpts: { collection: string; key: string }) => gql`
            {
              kv(collection: "${KVOpts.collection}", key: "${KVOpts.key}") {
                updatedAt
                name
                type
                value
              }
            }
          `,
      });
    // }
    // </ApolloProvider>
  }

  load(componentName: string): React.VFC {
    return this.#components[componentName];
  }
}
