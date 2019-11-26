import { AppContext } from '@asuna-admin/core/context';
import { gql } from 'apollo-boost';
import * as React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';

export interface IRegGraphqlProps {
  kvGql: (KVOpts: { collection: string; key: string }) => any;
}

export class ComponentService {
  private components = {};

  reg(componentName: string, component: React.FC) {
    this.components[componentName] = component;
  }

  regGraphql(componentName: string, renderComponent: React.FC) {
    this.components[componentName] = props => (
      <ApolloProvider client={AppContext.ctx.graphql.serverClient}>
        {renderComponent({
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
        })}
      </ApolloProvider>
    );
  }

  load(componentName: string) {
    return this.components[componentName];
  }
}
