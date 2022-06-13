import * as _ from 'lodash';

import { AppContext } from '../../core/context';
import { columnHelper } from './columns';
import { fpColumnCreator } from './creator';
import { ColumnsHelper } from './generator';

import type { Asuna } from '../../types/asuna';

/**
 * 通用配置
 */
export const commonColumns = {
  // any: (key, title?) => columnHelper.generate(key, title || key.toUpperCase()),
  primaryKey: (key, title, extras: Asuna.Schema.RecordRenderExtras) => columnHelper.generateID(extras)(key, title),
  primaryKeyByExtra: (extras: Asuna.Schema.RecordRenderExtras) => {
    const primaryKey = AppContext.adapters.models.getPrimaryKey(_.get(extras, 'modelName'));
    return columnHelper.generateID(extras)(primaryKey, primaryKey.toUpperCase());
  },
  id: (extras: Asuna.Schema.RecordRenderExtras) => columnHelper.generateID(extras)(),
  fpName: fpColumnCreator('名称', { searchType: 'like' }),
  fpOrdinal: fpColumnCreator('序号'),
  fpDescription: fpColumnCreator('描述', { searchType: 'like' }),
  fpTitle: fpColumnCreator('Title', { searchType: 'like' }),
  fpNameCn: fpColumnCreator('中文名称', { searchType: 'like' }),
  fpNameEn: fpColumnCreator('英文名称', { searchType: 'like' }),
  fpEmail: fpColumnCreator('Email', { searchType: 'like' }),
  fpType: fpColumnCreator('类型'),
  // fpLang: fpColumnCreator('语言', { searchType: 'list' }),
  fpCategory: (model) =>
    columnHelper.fpGenerateRelation('category', '分类', { transformer: 'name', filterType: 'list' }),
  fpEduType: fpColumnCreator('类型'),
  fpUpdatedBy: fpColumnCreator('Updated By', { searchType: 'list' }),
  createdAt: columnHelper.generateCalendar('createdAt', '创建时间'),
  updatedAt: columnHelper.generateCalendar('updatedAt', '更新时间'),
  isPublished: (model: string, extras: Asuna.Schema.RecordRenderExtras) =>
    ColumnsHelper.fpGenerateSwitch('isPublished', { model, title: '发布', ctx: extras.ctx }, extras),
  actions: columnHelper.generateActions,
};

export const defaultColumns = (actions) => [commonColumns.id, commonColumns.updatedAt, commonColumns.actions(actions)];

export const defaultColumnsByPrimaryKey =
  (primaryKey = 'id') =>
  (actions, extras) =>
    [
      commonColumns.primaryKey(primaryKey, primaryKey.toUpperCase(), extras),
      commonColumns.updatedAt,
      commonColumns.actions(actions),
    ];
