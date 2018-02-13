import { connect } from 'react-redux';
import * as R      from 'ramda';

import Header from '../components/Header';


const mapStateToProps = R.pick(['auth']);
// const mapDispatchToProps = dispatch => ({
//   onActive: key => dispatch(panesActions.active(key)),
//   onClose : key => dispatch(panesActions.close(key)),
// });

export default connect(mapStateToProps)(Header);
