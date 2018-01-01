import { connect } from 'react-redux';

import SideMenu         from '../components/SideMenu';
import { panesActions } from '../store/panes.redux';

const mapStateToProps    = state => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  onOpen: pane => dispatch(panesActions.open(pane)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SideMenu);
