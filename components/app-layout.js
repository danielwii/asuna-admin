import React from 'react';

export default ComposedComponent => class extends React.Component {
  render() {
    return (
      <section>
        <div>^_^2</div>
        <div>
          <ComposedComponent {...this.props} />
        </div>
      </section>
    )
  }
}
