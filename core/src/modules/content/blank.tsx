import * as React from 'react';
import { connect } from 'react-redux';

export default connect()(
  class extends React.Component {
    render(): React.ReactNode {
      const { children, Component } = this.props;
      console.log('blank', this.props);
      return (
        <div>
          <Component />
        </div>
      );
    }
  },
);
