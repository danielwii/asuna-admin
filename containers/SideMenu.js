import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import SideMenu from '../components/SideMenu';

import { routerActions } from '../store/router.redux';

const mapStateToProps    = state => ({ ...state.menu });
const mapDispatchToProps = dispatch => bindActionCreators(routerActions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(SideMenu);
