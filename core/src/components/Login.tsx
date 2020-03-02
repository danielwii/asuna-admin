/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { FormComponentProps, WrappedFormUtils } from '@ant-design/compatible/es/form/Form';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { createLogger } from '@asuna-admin/logger';

import { Button, Input } from 'antd';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';

const logger = createLogger('components:login');

// TODO using DynamicForm's component instead
function generateInput(form: WrappedFormUtils, name, type, required, message, placeholder, icon: React.ReactNode) {
  const decorator = form.getFieldDecorator<any>(name, { rules: [{ required, message }] });
  if (icon) {
    return decorator(<Input type={type} prefix={icon} placeholder={placeholder} />);
  }
  return decorator(<Input placeholder={placeholder} />);
}

export interface ILoginProps {
  form;
  login: (username: string, password: string, callback: (response) => void) => void;
}

interface IState {
  loading: true | false;
}

class NormalLoginForm extends React.Component<ILoginProps & FormComponentProps, IState> {
  state: IState = { loading: false };

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        logger.debug('Received values of form: ', values);
        const { username, password } = values;
        this.setState({ loading: true });

        this.props.login(username, password, ({ response, error }) => {
          logger.log('callback', { response, error });
          if (error) {
            this.setState({ loading: false });
          }
        });
      }
    });
  };

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error({ error, errorInfo });
  }

  render() {
    const { form } = this.props;
    const { loading } = this.state;

    if (loading) return <FoldingCube />;

    const usernameInput = generateInput(
      form,
      'username',
      'input',
      true,
      'Please input your username!',
      'Username',
      <UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />,
    );
    const passwordInput = generateInput(
      form,
      'password',
      'password',
      true,
      'Please input your Password!',
      'Password',
      <LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />,
    );

    logger.debug('[render]', { usernameInput, passwordInput });

    return (
      <Form
        onSubmit={this.handleSubmit}
        css={css`
          .ant-input-affix-wrapper {
            width: 20rem;
          }
        `}
      >
        <Form.Item>{usernameInput}</Form.Item>
        <Form.Item>{passwordInput}</Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button">
            Log in
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export const Login = Form.create<ILoginProps>()(NormalLoginForm) as any;
