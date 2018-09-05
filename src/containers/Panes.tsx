import { connect } from 'react-redux';

import { Panes } from '@asuna-admin/components';
import { RootState, panesActions } from '@asuna-admin/store';

const mapStateToProps = (state: RootState) => ({ ...state.panes });
const mapDispatchToProps = dispatch => ({
  onActive: key => dispatch(panesActions.active(key)),
  onClose: key => dispatch(panesActions.close(key)),
  onCloseWithout: key => dispatch(panesActions.onCloseWithout(key)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Panes);
