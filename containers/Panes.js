import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import Panes from '../components/Panes';

import { panesActions } from '../store/panes.redux';

const mapStateToProps    = state => ({ ...state.panes });
const mapDispatchToProps = dispatch => bindActionCreators(panesActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Panes);
