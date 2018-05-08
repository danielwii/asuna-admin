import { connect } from 'react-redux';

import Panes from '../components/Panes';

import { panesActions } from '../store/panes.actions';
import { RootState }    from '../store';

const mapStateToProps    = (state: RootState) => ({ ...state.panes });
const mapDispatchToProps = dispatch => ({
  onActive      : key => dispatch(panesActions.active(key)),
  onClose       : key => dispatch(panesActions.close(key)),
  onCloseWithout: key => dispatch(panesActions.onCloseWithout(key)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Panes);
