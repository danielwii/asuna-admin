import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import SideMenu from '../components/SideMenu';

import { routerActions } from '../store/router.redux';
import { panesActions }  from '../store/panes.redux';

const mapStateToProps    = state => ({ ...state.menu });
const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(routerActions, dispatch),
  ...bindActionCreators(panesActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(SideMenu);
