import { Checkbox, Table } from 'antd';
import * as R from 'ramda';
import * as React from 'react';

import { menuProxy } from '../../adapters/proxy';
import { createLogger } from '../../logger';

const logger = createLogger('components:authorities');

interface IProps {
  value?: string | {};
  onChange?: (authorities) => any;
}

interface IState {
  dataSource: any;
  columns: any;
}

export class Authorities extends React.Component<IProps, IState> {
  state: IState = {
    dataSource: [],
    columns: [
      {
        title: 'title',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'permission',
        dataIndex: 'permission',
        key: 'permission',
        render: ({ parent, menu, active }) => (
          <React.Fragment>
            <Checkbox checked={active} onChange={(e) => this.updatePermission(parent, menu, e.target.checked)}>
              激活
            </Checkbox>
          </React.Fragment>
        ),
      },
    ],
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    logger.log('[getDerivedStateFromProps]', { nextProps, prevState });
    const { value: authorities } = nextProps;
    const dataSource = Authorities.updateDataSource(Authorities.transformToJson(authorities));
    logger.log('[getDerivedStateFromProps]', { dataSource });
    return { dataSource };
  }

  static transformToJson = (authorities) => (R.is(String, authorities) ? JSON.parse(authorities) : authorities);

  static updateDataSource = (authorities) => {
    const sideMenus = menuProxy.getSideMenus();
    logger.debug('[updateDataSource]', { sideMenus, authorities });

    const dataSource = R.compose(
      R.flatten as any,
      R.map<any, any>((obj) =>
        R.map<any, any>((menu) => {
          const key = `${obj.key}::${menu.key}`;
          const active = R.propOr(false, key)(authorities);
          return {
            key,
            title: `${obj.title}::${menu.title}`,
            permission: { parent: obj, menu, active },
          };
        })(obj.subMenus),
      ),
    )(sideMenus);

    logger.debug('[updateDataSource]', 'dataSource is', dataSource);
    return dataSource;
  };

  updatePermission = (parent, menu, active) => {
    const { onChange, value } = this.props;

    const key = `${parent.key}::${menu.key}`;
    const authorities = R.mergeRight(Authorities.transformToJson(value), { [key]: active });

    logger.log('[updatePermission]', authorities, key, active);
    onChange!(authorities);
  };

  render() {
    const { dataSource, columns } = this.state;
    logger.log('[render]', { dataSource, columns });

    return (
      <React.Fragment>
        <Table dataSource={dataSource} columns={columns} />
      </React.Fragment>
    );
  }
}
