export const getMenus = () => ({
  menus: [
    {
      key     : 'models',
      title   : '模型系统',
      subMenus: [
        { key: 'models::index', title: '模型列表', linkTo: '/models-index' },
        // { key: 'models::setup', title: '模型配置', linkTo: '/models-setup' },
      ],
    },
  ],
});
