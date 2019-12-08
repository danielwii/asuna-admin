import { Pane } from '@asuna-admin/components';
import { AppContext } from '@asuna-admin/core';
import { Asuna } from '@asuna-admin/types';
import _ from 'lodash';

export function extractModelNameFromPane(pane: Pane): { modelName: string; extraName: string } {
  const matched = _.get(pane, 'key').match(/^\w+::(\w+).*$/);
  const extraName = matched ? matched[1] : null;
  const modelName = _.get(pane, 'model') || extraName;
  if (!modelName || !extraName) {
    throw new Error(`modelName must exists in pane ${JSON.stringify(pane)}`);
  }
  if (modelName !== extraName) console.log({ modelName, extraName });
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
  tableColumnOpts: Asuna.Schema.TableColumnOpts<any> | null;
  primaryKey: string;
  schema: Asuna.Schema.FormSchemas;
} {
  const modelConfig = AppContext.adapters.models.getModelConfig(modelName);
  const tableColumnOpts = AppContext.adapters.models.getTableColumnOpts(extraName || modelName);
  const primaryKeys = AppContext.adapters.models.getPrimaryKeys(modelName);
  const primaryKey = _.head(primaryKeys) || 'id';
  const schema = AppContext.adapters.models.getFormSchema(modelName);

  return { modelName, modelConfig, tableColumnOpts, primaryKey, schema };
}
