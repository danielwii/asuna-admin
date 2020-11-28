/** @jsxRuntime classic */
/** @jsx jsx */
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { createLogger } from '@asuna-admin/logger';
import { css, jsx } from '@emotion/react';
import { Button, Form, Input } from 'antd';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';

const logger = createLogger('components:login');

function generateInput2(name, type, required, message, placeholder, icon: React.ReactNode) {
  return (
    <Form.Item name={name} rules={[{ required, message }]}>
      <Input type={type} prefix={icon} placeholder={placeholder} />
    </Form.Item>
  );
}

export interface ILoginProps {
  login: (username: string, password: string, callback: (response) => void) => void;
}

export const NormalLoginForm: React.FC<ILoginProps> = ({ login }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  if (loading) return <FoldingCube />;

  const func = {
    onFinish: () => {
      form.validateFields().then((values) => {
        const { username, password } = values;
        setLoading(true);

        login(username, password, ({ response, error }) => {
          logger.log('callback', { response, error });
          if (error) setLoading(false);
        });
      });
    },
  };
  const rendered = {
    usernameInput: generateInput2(
      'username',
      'input',
      true,
      'Please input your username!',
      'Username',
      <UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />,
    ),
    passwordInput: generateInput2(
      'password',
      'password',
      true,
      'Please input your Password!',
      'Password',
      <LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />,
    ),
  };

  return (
    <Form
      form={form}
      onFinish={func.onFinish}
      scrollToFirstError
      css={css`
        .ant-input-affix-wrapper {
          width: 20rem;
        }
      `}
    >
      <Form.Item>{rendered.usernameInput}</Form.Item>
      <Form.Item>{rendered.passwordInput}</Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};
