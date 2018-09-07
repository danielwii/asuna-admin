import React from 'react';
import { connect } from 'react-redux';

import { SideMenu, ISideMenuProps } from '@asuna-admin/components';
import { panesActions, RootState } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  onOpen: pane => dispatch(panesActions.open(pane)),
});

// 申明该类型已防止生成的 .d.ts 中包含内嵌的 @asuna-admin 无法转化为相对路径
export { ISideMenuProps };

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SideMenu);
