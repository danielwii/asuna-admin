import { AppContext } from '@asuna-admin/core';
import { Asuna } from '@asuna-admin/types';
import * as _ from 'lodash';

export class SchemaHelper {
  static async getSchema(modelName: string): Promise<Asuna.Schema.OriginSchema | null> {
    return modelName ? AppContext.adapters.models.loadOriginSchema(modelName) : null;
  }

  static async getColumnInfo(modelName: string, columnName: string): Promise<Asuna.Schema.ModelSchema | undefined> {
    const schema = await this.getSchema(modelName);
    return _.find(schema?.columns, column => column.name === columnName);
  }
}
