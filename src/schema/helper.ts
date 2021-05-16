import * as _ from 'lodash';

import { AppContext } from '../core';
import { Asuna } from '../types';

export class SchemaHelper {
  static async getFormSchema(modelName: string): Promise<Asuna.Schema.FormSchemas | undefined> {
    return modelName ? AppContext.adapters.models.getFormSchema(modelName) : undefined;
  }

  static async getSchema(modelName: string): Promise<Asuna.Schema.OriginSchema | undefined> {
    return modelName ? AppContext.adapters.models.loadOriginSchema(modelName) : undefined;
  }

  static async getColumnInfo(modelName: string, columnName: string): Promise<Asuna.Schema.ModelSchema | undefined> {
    const schema = await this.getSchema(modelName);
    return _.find(schema?.columns, (column) => column.name === columnName);
  }
}
