import React from 'react';
import styled from 'styled-components';

import { Button, Dropdown, Icon, Layout, Menu } from 'antd';

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
  env?: string;
  version?: string;
  onSync: () => void;
  logout: () => void;
}

export class Header extends React.Component<IHeaderProps> {
  menu = () => (
    <Menu>
      <Menu.Item>
        <a>Profile</a>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item>
        <a onClick={this.props.logout}>Logout</a>
      </Menu.Item>
    </Menu>
  );

  render() {
    const { auth, app, onSync, env, version } = this.props;
    return (
      <Layout.Header className="header">
        <div className="logo">
          <StyledLogoImg
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAYAAADtwH1UAAAEuUlEQVRoQ+1ZSyh9XxRe13uAMJC88i4TBoSUMjGSR4lESh4pRCYiUQqRkhDlUTIg8hxI5DGQRxgg73dGYkZKiF/frn0699x77r3/e9Tx19mze+/ee639fWutb+19dd/f39+kDdUQ0GkEqIY9M6wRoC7+GgEq468RoBGgNgIq29c0QCNAZQRUNq9lwF8i4Pb2lsbHx2lubo62t7dljzYyMkJ5eXkqH/13mP+xDBgcHKTi4mKLTpWSkkIzMzNka2tr0fy/POlHCOjr66PS0lIDnCIiIsjOzo4+Pz/p4eGBHh8f2ZysrCwaGxsjGxubv4ytRWdTTMDd3R0FBgYKxsrLy6mqqor8/f0Z+Hy8vr5SfHw8HR4eEjJgdnZWIGB1dZW2trbo6+vLwGk3NzcqKytjc4+Ojmh0dJTtW11dTc7OzgbzUd5QCj08PIR1GxsbtLi4SPb29gbznZycKDIykhITE8nBwcHofjijTqfT+83d3Z0SEhLYWiVDMQG1tbXU2trKfGhoaKDGxkaj/ry9vVFsbKweAThUQUEBDQ8Py55BXK4Afm5uLnl6etLZ2RkBBOkoKiqioaEhRjLK3MfHB0VFRdHJyYlJnLDn5uYmBQcH683j+8ktHhgYIMyxdigmANHZ29tLvr6+DFxjoMA5YwRcXFxQeHi4Sd8RZWtra0wvJicnKTMz0yQBFRUV1N3dLWTZ+/u7QLw5kIKCgmh/f59cXFyEqeYIAHEHBwfk5eVlbnujvysiQAxqdnY2Kw/SVOVWjRFwfX1NYWFhbAoIbGpqIgDGB8oIojcgIIB9pZSA5ORkgl7hBR4lDSXv8vKScnJyBH2CjYyMDMEHZM7Ly4seePALQVFSUsK+R8eH7LZm/BgBiJ6lpSXmg/QvBtRsaEBqaird3NwI0Xl/f6+nH8YOgH1RwxFhSgmQE/+dnR0BwJ6eHqYdz8/PjJj5+XkDt/B9c3Oz4Pvu7i5FR0dbg7+yxzhxVP8X62IRbmlpobq6OpPLOXDT09OsBCFbjo+PydXV1WCdqRIkFX+++OrqikJDQ9lHTgDfx5hjaWlp1N7eLmTv/5oAHHBvb4+JqrRrAjnIGC66KysrjACM8/NzAQAxSNYQgDLESyEIyM/Pp5iYGCbcsN3W1kboliDoyG6UIGhXSEgIM/1rCEBaGmvl4CSyBeKIu4BcJIqBxEEB9tTUlCDwYgKQFajnAAMD9Rz6gzYYTQG3IRZhObtSAgoLCwXh7ujoYG21dCwvL1NSUtLv0QCIMC5XcgPRgzopvgeIRdhUDeIlBzri7e1tUbVTQoA4A2AMF0ofHx89uwsLC+wzOiaUQz8/P4v8kk5SJMIAhKequecFaReEHh2RZ64NhcPiXhvvTOnp6WYPy/2BXbGP4gsg3wTlj/vBNUDudi81jGzp7++3+laviAA8MQAMdApI/a6uLovaUFy+ACrKEW6S/IlCeri4uDiqqakhiJ54nJ6esjIzMTEhu7azs5MqKyvZMwhuueik5Lqgp6cngi3oDd60ACoGRB/7rK+vGxCOyK+vrydojqOjo9mAkJugiACrrWoLBQQ0AlQOBo0AjQCVEVDZvJYBGgEqI6CyeS0DNAJURkBl81oGqEzAPwKEIs6uMDNsAAAAAElFTkSuQmCC"
            alt="mast"
          />
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
              <Dropdown overlay={this.menu()}>
                <a>{auth.username}</a>
              </Dropdown>
              . <Button icon="sync" onClick={onSync} />
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
