import { Pane } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { createLogger } from '@asuna-admin/logger';
import { SchemaHelper } from '@asuna-admin/schema';
import { panesActions } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';
import * as _ from 'lodash';

const logger = createLogger('helpers:models');

export function extractModelNameFromPane(pane: Pane): { modelName: string; extraName: string } {
  const matched = _.get(pane, 'key').match(/^\w+::(\w+).*$/);
  const extraName = matched ? matched[1] : null;
  const modelName = _.get(pane, 'model') || extraName;
  if (!modelName || !extraName) {
    throw new Error(`modelName must exists in pane ${JSON.stringify(pane)}`);
  }
  if (modelName !== extraName) logger.log({ pane, modelName, extraName });
  return { modelName, extraName };
}

/**
 * 通过 panel 的 pane 信息拿到模型名称，然后获取常用的模型信息
 * content::name => name
 * @param modelName
 * @param extraName
 */
export function resolveModelInPane(
  modelName: string,
  extraName?: string,
): {
  modelName: string;
  modelConfig: Asuna.Schema.ModelConfig;
  columnOpts?: Asuna.Schema.ColumnOpts<any>;
  primaryKey: string;
  schemas: Asuna.Schema.FormSchemas;
} {
  const modelConfig = AppContext.adapters.models.getModelConfig(modelName);
  const columnOpts = AppContext.adapters.models.getColumnOpts(extraName || modelName);
  const primaryKeys = AppContext.adapters.models.getPrimaryKeys(modelName);
  const primaryKey = _.head(primaryKeys) || 'id';
  const schemas = AppContext.adapters.models.getFormSchema(modelName);

  logger.log({
    modelName,
    extraName,
    modelConfig,
    columnOpts,
    primaryKey,
    schemas,
    allTableColumnOpts: AppContext.adapters.models.columnOpts,
    resolved: AppContext.adapters.models.columnOpts[extraName || modelName],
  });
  return { modelName, modelConfig, columnOpts, primaryKey, schemas };
}

export class ModelsHelper {
  static async openCreatePane(modelName: string): Promise<void> {
    const schema = await SchemaHelper.getSchema(modelName);
    const name = schema?.info?.displayName ?? modelName;
    logger.log('[create]', modelName, name, schema);
    AppContext.dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${Date.now()}`,
        title: `新建 - ${schema?.info?.displayName ?? modelName}`,
        linkTo: 'content::upsert',
      }),
    );
  }

  static async openEditPane(modelName: string, record: any, opts?: { id?: string; name?: string }): Promise<void> {
    const schema = await SchemaHelper.getSchema(modelName);
    const name = schema?.info?.displayName ?? modelName;
    logger.log('[edit]', name, record, schema);
    AppContext.dispatch(
      panesActions.open({
        key: `content::upsert::${modelName}::${record[opts?.id ?? 'id']}`,
        title: `编辑 - ${name} - ${record[opts?.name ?? 'name'] || record[opts?.name ?? 'title'] || ''}`,
        linkTo: 'content::upsert',
        data: { modelName, record },
      }),
    );
  }
}
