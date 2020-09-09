import { Panes } from '@asuna-admin/components';
import { panesActions, RootState } from '@asuna-admin/store';

import * as React from 'react';
import { connect } from 'react-redux';

const mapStateToProps = (state: RootState) => ({ ...state.panes });
const mapDispatchToProps = (dispatch) => ({
  onActive: (key) => dispatch(panesActions.active(key)),
  onClose: (key) => dispatch(panesActions.close(key)),
  onCloseWithout: (key) => dispatch(panesActions.onCloseWithout(key)),
  onCloseCurrent: (key) => dispatch(panesActions.onCloseCurrent(key)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Panes);
