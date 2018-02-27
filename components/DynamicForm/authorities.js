import React     from 'react';
import * as R    from 'ramda';
import PropTypes from 'prop-types';

import { Checkbox, Table } from 'antd';

import { menuProxy }    from '../../adapters/menu';
import { createLogger } from '../../adapters/logger';

const logger = createLogger('components:authorities', 1);

// eslint-disable-next-line import/prefer-default-export
export class Authorities extends React.Component {
  static propTypes = {
    value   : PropTypes.oneOfType(PropTypes.string, PropTypes.shape({})),
    onChange: PropTypes.func,
  };

  state = {
    columns: [{
      title    : 'title',
      dataIndex: 'title',
      key      : 'title',
    }, {
      title    : 'permission',
      dataIndex: 'permission',
      key      : 'permission',
      render   : ({ parent, menu, active }) => (
        <React.Fragment>
          <Checkbox
            checked={active}
            onChange={e => this.updatePermission(parent, menu, e.target.checked)}
          >
            激活
          </Checkbox>
        </React.Fragment>
      ),
    }],
  };

  componentWillMount(): void {
    logger.info('[componentWillMount]');
    const { value: authorities } = this.props;
    this.updateDataSource(this.transformToJson(authorities));
  }

  componentWillReceiveProps(nextProps, nextContext: any): void {
    logger.info('[componentWillReceiveProps]', nextProps, nextContext);
    const { value: authorities } = nextProps;
    this.updateDataSource(this.transformToJson(authorities));
  }

  transformToJson = authorities =>
    (R.is(String, authorities) ? JSON.parse(authorities) : authorities);

  updateDataSource = (authorities) => {
    const registeredModels = menuProxy.getRegisteredModels();
    logger.info('[updateDataSource]', 'all registeredModels is', registeredModels, 'authorities is', authorities);

    const dataSource = R.compose(
      R.flatten,
      R.map(obj => R.map((menu) => {
        const key    = `${obj.key}::${menu.key}`;
        const active = R.propOr(false, key)(authorities);
        return {
          key,
          title     : `${obj.title}::${menu.title}`,
          permission: { parent: obj, menu, active },
        };
      })(obj.subMenus)),
    )(registeredModels);

    logger.info('[updateDataSource]', 'dataSource is', dataSource);
    this.setState({ dataSource });
  };

  updatePermission = (parent, menu, active) => {
    const { onChange, value } = this.props;

    const key         = `${parent.key}::${menu.key}`;
    const authorities = R.merge(this.transformToJson(value), { [key]: active });
    logger.log('[updatePermission]', authorities, key, active);
    onChange(authorities);
  };

  render() {
    const { dataSource, columns } = this.state;

    logger.log('props is', this.props, dataSource, columns);
    return (
      <React.Fragment>
        <Table dataSource={dataSource} columns={columns} />
      </React.Fragment>
    );
  }
}
