import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';


class ModelsSetup extends React.Component {
  static propTypes = {
    // models: PropTypes.shape({}),
  };

  render() {
    return (
      <div>model setup</div>
    );
  }
}

export default connect()(ModelsSetup);
