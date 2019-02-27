import React from 'react';
import { connect } from 'react-redux';

import { DebugSettings, IDebugSettingsProps } from '@asuna-admin/components';
import { modules } from '@asuna-admin/logger';
import { RootState } from '@asuna-admin/store';

const mapStateToProps = (state: RootState): Partial<IDebugSettingsProps> => ({
  modules: modules,
});
const mapDispatchToProps = dispatch => ({});

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps,
// )(DebugSettings);

// props => <DebugSettings {...props} />
export function withDebugSettingsProps(fn: (props: IDebugSettingsProps) => any) {
  // console.log({ fn, modules });
  return fn({ modules });
}
