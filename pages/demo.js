import React          from 'react';
import { connect }    from 'react-redux';
import PropTypes      from 'prop-types';
import Link           from 'next/link';
import { DatePicker } from 'antd';

import AntdLayout                     from '../layout/antd';
import { actionTypes, withReduxSaga } from '../store';

class Home extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired,
  };

  static async getInitialProps({ store }) {
  }

  componentDidMount() {
  }

  render() {
    const { message, dispatch } = this.props;
    return (
      <AntdLayout>
        <div>
          <h1>- Home -</h1>
          <hr />
          <div>Message: {message}</div>
          <hr />
          <div>
            <button onClick={() => dispatch({ type: actionTypes.login.LOGIN })}>hello2</button>
          </div>
          <hr />
          <ul>
            <li>
              go to{' '}
              <Link href="/login">
                <button>login</button>
              </Link>
            </li>
          </ul>
          <hr />
          <DatePicker />
        </div>
      </AntdLayout>
    );
  }
}

const HomeConnector = connect(state => ({ ...state.global }))(Home);

export default withReduxSaga(HomeConnector);
