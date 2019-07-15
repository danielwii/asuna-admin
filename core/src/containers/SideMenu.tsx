import { SideMenu } from '@asuna-admin/components';
import { panesActions, RootState } from '@asuna-admin/store';
import { Asuna } from '@asuna-admin/types';

import React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = (state: RootState) => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  onOpen: (pane: Asuna.Schema.Pane) => dispatch(panesActions.open(pane)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SideMenu);
