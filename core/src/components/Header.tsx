import React from 'react';
import styled from 'styled-components';

import { Dropdown, Icon, Layout, Menu } from 'antd';

import { AppState, AuthState } from '@asuna-admin/store';

const StyledLogoImg = styled.img`
  width: 120px;
  height: 32px;
  margin: 16px 28px 16px 0;
  float: left;
  border-radius: 0.1rem;
`;
const StyledVersion = styled.span`
  color: silver;
  vertical-align: baseline;
`;

export interface IHeaderProps {
  auth: AuthState;
  app: AppState;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  env?: string;
  version?: string;
  onSync: () => void;
  logout: () => void;
}

export class Header extends React.Component<IHeaderProps> {
  _renderMenu = () => (
    <Menu>
      <Menu.Item>
        {/*<a>Profile</a>*/}
        <a onClick={this.props.onSync}>Sync Models</a>
        {/*<Button icon="sync" onClick={this.props.onSync} />*/}
      </Menu.Item>
      <Menu.Divider />
      {this.props.isAdmin && (
        <Menu.Item>
          <a>Settings</a>
        </Menu.Item>
      )}
      {this.props.isAdmin && <Menu.Divider />}
      {this.props.isSuperAdmin && (
        <Menu.Item>
          <a>Administrations</a>
        </Menu.Item>
      )}
      {this.props.isSuperAdmin && <Menu.Divider />}
      {this.props.env !== 'production' && (
        <Menu.Item>
          <a>Debug Settings</a>
        </Menu.Item>
      )}
      {this.props.env !== 'production' && <Menu.Divider />}
      <Menu.Item>
        <a onClick={this.props.logout}>Logout</a>
      </Menu.Item>
    </Menu>
  );

  render() {
    const { auth, app, env, version } = this.props;
    const asuna =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAYAAADtwH1UAAAEuUlEQVRoQ+1ZSyh9XxR' +
      'e13uAMJC88i4TBoSUMjGSR4lESh4pRCYiUQqRkhDlUTIg8hxI5DGQRxgg73dGYkZKiF/frn0699x77r3/e9Tx19mz' +
      'e+/ee639fWutb+19dd/f39+kDdUQ0GkEqIY9M6wRoC7+GgEq468RoBGgNgIq29c0QCNAZQRUNq9lwF8i4Pb2lsbHx' +
      '2lubo62t7dljzYyMkJ5eXkqH/13mP+xDBgcHKTi4mKLTpWSkkIzMzNka2tr0fy/POlHCOjr66PS0lIDnCIiIsjOzo' +
      '4+Pz/p4eGBHh8f2ZysrCwaGxsjGxubv4ytRWdTTMDd3R0FBgYKxsrLy6mqqor8/f0Z+Hy8vr5SfHw8HR4eEjJgdnZ' +
      'WIGB1dZW2trbo6+vLwGk3NzcqKytjc4+Ojmh0dJTtW11dTc7OzgbzUd5QCj08PIR1GxsbtLi4SPb29gbznZycKDIy' +
      'khITE8nBwcHofjijTqfT+83d3Z0SEhLYWiVDMQG1tbXU2trKfGhoaKDGxkaj/ry9vVFsbKweAThUQUEBDQ8Py55BX' +
      'K4Afm5uLnl6etLZ2RkBBOkoKiqioaEhRjLK3MfHB0VFRdHJyYlJnLDn5uYmBQcH683j+8ktHhgYIMyxdigmANHZ29' +
      'tLvr6+DFxjoMA5YwRcXFxQeHi4Sd8RZWtra0wvJicnKTMz0yQBFRUV1N3dLWTZ+/u7QLw5kIKCgmh/f59cXFyEqeY' +
      'IAHEHBwfk5eVlbnujvysiQAxqdnY2Kw/SVOVWjRFwfX1NYWFhbAoIbGpqIgDGB8oIojcgIIB9pZSA5ORkgl7hBR4l' +
      'DSXv8vKScnJyBH2CjYyMDMEHZM7Ly4seePALQVFSUsK+R8eH7LZm/BgBiJ6lpSXmg/QvBtRsaEBqaird3NwI0Xl/f' +
      '6+nH8YOgH1RwxFhSgmQE/+dnR0BwJ6eHqYdz8/PjJj5+XkDt/B9c3Oz4Pvu7i5FR0dbg7+yxzhxVP8X62IRbmlpob' +
      'q6OpPLOXDT09OsBCFbjo+PydXV1WCdqRIkFX+++OrqikJDQ9lHTgDfx5hjaWlp1N7eLmTv/5oAHHBvb4+JqrRrAjn' +
      'IGC66KysrjACM8/NzAQAxSNYQgDLESyEIyM/Pp5iYGCbcsN3W1kboliDoyG6UIGhXSEgIM/1rCEBaGmvl4CSyBeKI' +
      'u4BcJIqBxEEB9tTUlCDwYgKQFajnAAMD9Rz6gzYYTQG3IRZhObtSAgoLCwXh7ujoYG21dCwvL1NSUtLv0QCIMC5Xc' +
      'gPRgzopvgeIRdhUDeIlBzri7e1tUbVTQoA4A2AMF0ofHx89uwsLC+wzOiaUQz8/P4v8kk5SJMIAhKequecFaReEHh' +
      '2RZ64NhcPiXhvvTOnp6WYPy/2BXbGP4gsg3wTlj/vBNUDudi81jGzp7++3+laviAA8MQAMdApI/a6uLovaUFy+ACr' +
      'KEW6S/IlCeri4uDiqqakhiJ54nJ6esjIzMTEhu7azs5MqKyvZMwhuueik5Lqgp6cngi3oDd60ACoGRB/7rK+vGxCO' +
      'yK+vrydojqOjo9mAkJugiACrrWoLBQQ0AlQOBo0AjQCVEVDZvJYBGgEqI6CyeS0DNAJURkBl81oGqEzAPwKEIs6uM' +
      'DNsAAAAAElFTkSuQmCC';
    return (
      <Layout.Header className="header">
        <div className="logo">
          <StyledLogoImg src={asuna} alt="mast" />
        </div>
        {/*prettier-ignore*/}
        <StyledVersion>
          {env}-v{version}::{app.version}
        </StyledVersion>
        {/*
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          style={{ lineHeight: '64px' }}
        >
          <Menu.Item key="1">Home</Menu.Item>
        </Menu>
        */}
        <div className="header-user">
          {auth.username ? (
            <div>
              Welcome,&nbsp;
              <Dropdown overlay={this._renderMenu()}>
                <a>{auth.username}</a>
              </Dropdown>
              .
            </div>
          ) : (
            <Icon type="loading" style={{ marginLeft: 8, fontSize: 24 }} spin />
          )}
        </div>
        {/* language=CSS */}
        <style jsx>{`
          .header-user {
            float: right;
            color: white;
          }
        `}</style>
      </Layout.Header>
    );
  }
}
