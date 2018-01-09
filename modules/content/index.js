import React       from 'react';
import { connect } from 'react-redux';

class ContentIndex extends React.Component {
  getInitialProps() {
    console.log('props is', this.props);
  }

  render() {
    return (
      <div>hello kitty!</div>
    );
  }
}

export default connect()(ContentIndex);
