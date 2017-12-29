export const getMenus = () => ({
  menus: [
    {
      key     : 'models',
      title   : '模型系统',
      subMenus: [
        { key: 'models::setup', title: '模型配置', linkTo: '/models' },
      ],
    },
  ],
});
