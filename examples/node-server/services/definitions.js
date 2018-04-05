/* eslint-disable max-len */
import React  from 'react';
import * as R from 'ramda';

import { Button, Checkbox, Divider } from 'antd';

import { createLogger }  from '../adapters/logger';
import { securityProxy } from '../adapters/security';

import { columnHelper, commonColumns, defaultNameColumns, defaultTitleColumns } from '../helpers';

import { DynamicFormTypes } from '../components/DynamicForm';
import { FormModal }        from '../components/FormModal';


const logger = createLogger('service:definitions');

const defaultEnNameColumns = actions => [
  commonColumns.id,
  commonColumns.name,
  commonColumns.name_en,
  commonColumns.updated_at,
  commonColumns.actions(actions),
];
/**
 * 模型列表页配置
 * @type {{colleges: function(*=): *[], countries: function(*=): *[]}}
 */
const tableColumns         = {
  sort__sequences   : actions => [
    commonColumns.id,
    commonColumns.name,
    commonColumns.type,
    commonColumns.updated_at,
    commonColumns.actions(actions),
  ],
  slides            : defaultNameColumns,
  // categories        : defaultNameColumns,
  colleges          : defaultEnNameColumns,
  college_ads       : defaultNameColumns,
  about             : defaultNameColumns,
  about_categories  : defaultEnNameColumns,
  countries         : defaultEnNameColumns,
  majors            : defaultEnNameColumns,
  major_categories  : defaultEnNameColumns,
  articles          : defaultTitleColumns,
  article_categories: defaultEnNameColumns,
  article_topics    : actions => [
    commonColumns.id,
    commonColumns.name,
    commonColumns.title,
    commonColumns.updated_at,
    commonColumns.actions(actions),
  ],
  ranking_categories: defaultNameColumns,
  teachers          : defaultNameColumns,
  teacher_categories: defaultEnNameColumns,
  students          : defaultNameColumns,
  student_categories: defaultEnNameColumns,
  events            : defaultNameColumns,
  activity_students : defaultNameColumns,
  faqs              : actions => [
    commonColumns.id,
    columnHelper.generate('problem', '问题'),
    commonColumns.updated_at,
    commonColumns.actions(actions),
  ],
  faq_categories    : defaultEnNameColumns,
  videos            : defaultNameColumns,
  video_categories  : defaultEnNameColumns,
  // --------------------------------------------------------------
  // Admin
  // --------------------------------------------------------------
  admin__users      : actions => [
    commonColumns.id,
    commonColumns.email,
    {
      title    : '启用',
      dataIndex: 'active',
      key      : 'active',
      render   : checked => <Checkbox checked={checked} disabled />,
    },
    commonColumns.actions(actions, (text, record, auth) => (
      <React.Fragment>
        <FormModal
          title="Reset Password"
          openButton={open => (
            <Button size="small" type="dashed" onClick={open}>Reset Password</Button>
          )}
          onSubmit={({ password }) => {
            logger.log('auth is', auth, text, record);
            return securityProxy.updatePassword({
              opts: auth,
              data: { body: { email: record.email, password } },
            });
          }}
          fields={{
            password: {
              name   : 'password',
              type   : DynamicFormTypes.Input,
              options: { required: true },
            },
          }}
        />
        <Divider type="vertical" />
      </React.Fragment>
    )),
  ],
  admin__roles      : actions => [
    commonColumns.id,
    commonColumns.name,
    commonColumns.actions(actions),
  ],
};

/**
 * 描述关联下拉菜单的查询可显示字段
 * @type {{}}
 */
export const associations = {
  faqs         : {
    name  : 'problem',
    fields: ['id', 'problem'],
  },
  rankings     : {
    name  : 'rank_number',
    fields: ['id', 'rank_number'],
  },
  activity_data: {
    name  : 'category',
    fields: ['id', 'category'],
  },
};

/**
 * 模型新增 / 编辑页面配置
 * fields 用于定义要获取的属性列表，用于减少消息体
 * default:
 *   [model]:
 *     associations:
 *       [association]:
 *         name: 'name',
 *         value: 'id',
 *         ref: 'association-ref-name',
 *         fields: ['id', 'name'],
 */
const modelColumns = {
  admin__roles      : {
    associations: {
      admin__users: {
        name  : 'email',
        fields: ['id', 'email'],
      },
    },
  },
  admin__users      : {
    settings: {
      password: {
        accessible: 'hide-value',
        help      : '新建用户后在列表页面设置密码',
      },
    },
  },
  sort__sequences   : { settings: { type: { enumSelector: { name: R.prop(1), value: R.prop(0) } } } },
  ranking_categories: { settings: { type: { enumSelector: { name: R.prop(1), value: R.prop(0) } } } },
  slides            : {
    settings: {
      type  : { enumSelector: { name: R.prop(1), value: R.prop(0) } },
      target: { enumSelector: { name: R.prop(1), value: R.prop(0) } },
    },
  },
};

/**
 * 关联模型配置
 * endpoint: /rest/modelName
 */
export const modelConfigs     = {
  tableColumns,
  modelColumns,
  models: {
    // categories        : {},
    colleges          : {},
    slides            : {},
    countries         : {},
    abouts            : {},
    about_categories  : {},
    articles          : {},
    article_categories: {},
    article_topics    : {},
    teachers          : {},
    teacher_categories: {},
    students          : {},
    student_categories: {},
    videos            : {},
    video_categories  : {},
    college_ads       : {},
    majors            : {},
    sort__sequences   : {},
    major_categories  : {},
    rankings          : {},
    ranking_categories: {},
    events            : {},
    activity_data     : {},
    activity_students : {},
    faqs              : {},
    faq_categories    : {},
    admin__users      : {
      endpoint: 'admin/auth/users',
    },
    admin__roles      : {
      endpoint: 'admin/auth/roles',
    },
  },
};
/**
 * 定义左侧导航条
 * @type {*[]}
 */
export const registeredModels = [
  {
    key     : 'sites',
    title   : '网站管理',
    subMenus: [
      { key: 'slides', title: '幻灯片管理', linkTo: 'content::index' },
      { key: 'abouts', title: '网站信息', linkTo: 'content::index' },
      { key: 'about_categories', title: '网站信息分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'content',
    title   : '内容系统',
    subMenus: [
      { key: 'sort__sequences', title: '序列管理', linkTo: 'content::index' },
      // { key: 'categories', title: '类型管理', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'colleges',
    title   : '院校管理',
    subMenus: [
      { key: 'colleges', title: '院校列表', linkTo: 'content::index' },
      { key: 'countries', title: '国家列表', linkTo: 'content::index' },
      { key: 'college_ads', title: '院校广告列表', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'majors',
    title   : '专业管理',
    subMenus: [
      { key: 'majors', title: '专业列表', linkTo: 'content::index' },
      { key: 'major_categories', title: '专业分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'news',
    title   : '资讯管理',
    subMenus: [
      { key: 'articles', title: '资讯列表', linkTo: 'content::index' },
      { key: 'article_categories', title: '资讯分类', linkTo: 'content::index' },
      { key: 'article_topics', title: '专题资讯列表', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'rankings',
    title   : '排名管理',
    subMenus: [
      { key: 'rankings', title: '排名列表', linkTo: 'content::index' },
      { key: 'ranking_categories', title: '排名分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'teachers',
    title   : '导师学生管理',
    subMenus: [
      { key: 'teachers', title: '导师列表', linkTo: 'content::index' },
      { key: 'teacher_categories', title: '导师分类', linkTo: 'content::index' },
      { key: 'students', title: '学生列表', linkTo: 'content::index' },
      { key: 'student_categories', title: '学生分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'events',
    title   : '活动管理',
    subMenus: [
      { key: 'events', title: '活动列表', linkTo: 'content::index' },
      { key: 'activity_data', title: '活动数据', linkTo: 'content::index' },
      { key: 'activity_students', title: '录取学生', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'faqs',
    title   : 'FAQ 管理',
    subMenus: [
      { key: 'faqs', title: 'FAQ 列表', linkTo: 'content::index' },
      { key: 'faq_categories', title: 'FAQ 分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'videos',
    title   : '视频管理',
    subMenus: [
      { key: 'videos', title: '视频管理', linkTo: 'content::index' },
      { key: 'video_categories', title: '视频分类', linkTo: 'content::index' },
    ],
  },
  {
    key     : 'admin',
    title   : '系统管理',
    subMenus: [
      { key: 'admin__users', title: '用户管理', linkTo: 'content::index' },
      { key: 'admin__roles', title: '角色管理', linkTo: 'content::index' },
    ],
  },
];
