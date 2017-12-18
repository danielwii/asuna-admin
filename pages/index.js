/* eslint-disable key-spacing */

import withAppLayout from '../components/app-layout';
import { actionTypes, withReduxSaga } from '../store';


const Home = ({ message, dispatch }) => (
  <div>
    <h1>- Home -</h1>
    <hr />
    <div>
      {message}
    </div>
    <div>
      <button onClick={() => dispatch({ type: actionTypes.login.LOGIN })}>hello2</button>
    </div>
  </div>
);

export default withReduxSaga(withAppLayout(Home));
