import consola from 'consola';
import _ from 'lodash';
import * as React from 'react';

import { GroupFormKVComponent } from '../components/KV/group';
import { ListKVComponent } from '../components/KV/list';
import { AppContext, IComponentService } from '../core/context';
import { createLogger } from '../logger';

import type { KeyValueModelVo } from '../adapters/graphql';

const logger = createLogger('helper:register');

export interface IRegGraphqlProps {
  kvGql: (KVOpts: { collection: string; key: string }) => any;
}

// export const DefaultKVComponent: React.VFC = () => {};

export class ComponentService implements IComponentService {
  #components: { [key: string]: React.VFC } = {};

  reg(componentName: string, component: React.VFC): void {
    this.#components[componentName] = component;
  }

  regGraphql(componentName: string, model?: KeyValueModelVo, render?: React.VFC): void {
    consola.info('reg graphql component', { componentName, client: _.get(AppContext.ctx, 'graphql.client') }, model);
    this.#components[componentName] = (props) => {
      // <ApolloProvider client={AppContext.ctx.graphql.client as any /* TODO error occurred */}>
      //   {

      logger.log(`render ${componentName}`, { model, render });
      if (model) {
        return model.formatType === 'KVGroupFieldsValue' ? (
          // KVGroupFieldsValue
          <GroupFormKVComponent kvCollection={model.pair.collection} kvKey={model.pair.key} />
        ) : (
          // LIST
          <ListKVComponent kvCollection={model.pair.collection} kvKey={model.pair.key} />
        );
      }
      return render ? render({}) : <div>no implemented ${componentName}</div>;
    };
    // }
    // </ApolloProvider>
  }

  load(component: string): React.VFC {
    logger.log('load component', { component, components: this.#components });
    return this.#components[component];
  }
}
