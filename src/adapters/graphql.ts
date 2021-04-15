import ApolloClient, { gql, InMemoryCache } from 'apollo-boost';
import * as fp from 'lodash/fp';

import { authHeader } from '../helpers';
import { createLogger } from '../logger';

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

export type KeyValuePairVo = { collection: string; key: string; name: string; type: string; value: string };

export type KeyValueModelVo = { name: string; description: string; formatType: string; pair: KeyValuePairVo };

export class GraphqlAdapterImpl {
  public client: ApolloClient<InMemoryCache>;
  // public serverClient: ApolloClient<InMemoryCache>;
  constructor(uri?: string) {
    console.log('init graphql api with', uri);
    if (uri) {
      this.client = new ApolloClient({ uri, headers: authHeader().headers });
    } else {
      logger.log('graphql uri not defined, using /graphql for default');
      this.client = new ApolloClient({ uri: '/graphql', headers: authHeader().headers });
    }
    // this.client = new ApolloClient({ uri, headers: authHeader().headers });
  }

  async query(queryString: string, client = this.client) {
    const promise = client.query({
      query: gql`
        ${queryString}
      `,
    });
    // AppContext.syncSettings().catch(reason => logger.error(reason));
    return promise;
  }

  async queryT(query: any, client = this.client) {
    const promise = client.query({ query });
    // AppContext.syncSettings().catch(reason => logger.error(reason));
    return promise;
  }

  async loadSchemas() {
    return this.client
      .query({
        fetchPolicy: 'no-cache',
        query: gql`
          {
            sys_modelSchemas {
              name
              schema
            }
          }
        `,
      })
      .then(fp.get('data.sys_modelSchemas'));
  }

  async loadSystemSettings() {
    return this.client
      .query({
        query: gql`
          {
            kvs(collection: "system.server") {
              key
              name
              type
              value
            }
          }
        `,
      })
      .then(fp.get('data.kvs'));
  }

  async loadKv(collection: string, key: string): Promise<KeyValuePairVo> {
    return this.client
      .query({
        // fetchPolicy: 'cache-first',
        variables: { nCollection: collection, nKey: key },
        query: gql`
          query loadKv($nCollection: String, $nKey: String) {
            kv(collection: $nCollection, key: $nKey) {
              collection
              key
              name
              type
              value
            }
          }
        `,
      })
      .then(fp.get('data.kv'));
  }

  async loadKvModels(): Promise<KeyValueModelVo[]> {
    return this.client
      .query({
        fetchPolicy: 'no-cache',
        query: gql`
          query loadKvModels {
            kv_models {
              name
              description
              formatType
              pair {
                collection
                key
                value
                type
              }
            }
          }
        `,
      })
      .then(fp.get('data.kv_models'));
  }

  async loadGraphs() {
    return this.client
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
