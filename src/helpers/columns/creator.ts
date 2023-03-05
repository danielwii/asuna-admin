import { ColumnsHelper } from './generator';

import type { Asuna } from '../../types/asuna';
import type { TextColumnOpts } from './types';

export const columnCreator: (
  modelOpts: { model: string; title?: string },
  columnOpts?: TextColumnOpts,
) => Asuna.Schema.ColumnPropsCreator =
  (modelOpts, columnOpts) =>
  (key, actions, { ctx, callRefresh }) =>
    ColumnsHelper.generate(key, { ...modelOpts, ctx, callRefresh }, columnOpts);

export const fpColumnCreator = (title?: string, columnOpts?: TextColumnOpts) => (model: string) =>
  columnCreator({ model, title }, columnOpts);
