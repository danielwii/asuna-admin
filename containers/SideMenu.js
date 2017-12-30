import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import SideMenu from '../components/SideMenu';

import { routerActions } from '../store/router.redux';
import { panesActionEvents }  from '../store/panes.redux';

const mapStateToProps    = state => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(routerActions, dispatch),
  ...bindActionCreators(panesActionEvents, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SideMenu);
