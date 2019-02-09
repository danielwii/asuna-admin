import React from 'react';
import { connect } from 'react-redux';

import { SideMenu } from '@asuna-admin/components';
import { panesActions, RootState } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  onOpen: pane => dispatch(panesActions.open(pane)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SideMenu);
