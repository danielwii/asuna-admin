import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import Panes from '../components/Panes';

import { panesActionEvents } from '../store/panes.redux';

const mapStateToProps    = state => ({ ...state.panes });
const mapDispatchToProps = dispatch => bindActionCreators(panesActionEvents, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Panes);
