import * as _ from 'lodash';

import { AppContext } from '../core';
import { Asuna } from '../types';

export class SchemaHelper {
  static async getFormSchema(modelName: string): Promise<Asuna.Schema.FormSchemas | null> {
    return modelName ? AppContext.adapters.models.getFormSchema(modelName) : null;
  }

  static async getSchema(modelName: string): Promise<Asuna.Schema.OriginSchema | null> {
    return modelName ? AppContext.adapters.models.loadOriginSchema(modelName) : null;
  }

  static async getColumnInfo(modelName: string, columnName: string): Promise<Asuna.Schema.ModelSchema | undefined> {
    const schema = await this.getSchema(modelName);
    return _.find(schema?.columns, (column) => column.name === columnName);
  }
}
