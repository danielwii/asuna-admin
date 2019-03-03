import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import * as fp from 'lodash/fp';
import { createLogger } from '@asuna-admin/logger';

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

/*
export interface IGraphQLService {
  client: ApolloClient<any>;
  serverClient: ApolloClient<any>;
  query(queryString: string): Promise<any>;
  queryT(query: string): Promise<any>;
  loadSchemas(): Promise<any>;
}
*/

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const logger = createLogger('adapters:graphql');

export class GraphqlAdapter {
  public client: ApolloClient<any>;
  public serverClient: ApolloClient<any>;
  constructor(uri?: string) {
    if (uri) {
      this.client = new ApolloClient({ uri });
    } else {
      logger.log('graphql uri not defined, using /graphql for default');
      this.client = new ApolloClient({ uri: '/graphql' });
    }
    this.serverClient = new ApolloClient({ uri: '/s-graphql' });
  }

  async query(queryString: string) {
    return this.client.query({
      query: gql`
        ${queryString}
      `,
    });
  }

  async queryT(query: string) {
    return this.client.query({ query });
  }

  async loadSchemas() {
    return this.serverClient
      .query({
        query: gql`
          {
            model_schemas {
              name
              schema
            }
          }
        `,
      })
      .then(fp.get('data.model_schemas'));
  }

  async loadGraphs() {
    return this.serverClient
      .query({
        query: gql`
          {
            __schema {
              queryType {
                fields {
                  name
                }
              }
            }
          }
        `,
      })
      .then(fp.get('data.__schema.queryType.fields'))
      .then(fp.map(fp.get('name')));
  }
}
