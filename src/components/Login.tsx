/** @jsxRuntime classic */

/** @jsx jsx */
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { css, jsx } from '@emotion/react';

import { Button, Form, Input } from 'antd';
import { InputProps } from 'antd/es/input';
import * as React from 'react';
import { FoldingCube } from 'styled-spinkit';

import { createLogger } from '../logger';

const logger = createLogger('components:login');

const FormInput: React.VFC<
  { name: string; required: boolean; message: string } & Pick<InputProps, 'type' | 'prefix' | 'placeholder'>
> = ({ name, required, message, type, prefix, placeholder }) => (
  <Form.Item name={name} rules={[{ required, message }]}>
    <Input type={type} prefix={prefix} placeholder={placeholder} />
  </Form.Item>
);

/*
function generateInput2(name, type, required, message, placeholder, icon: React.ReactNode) {
  return (
    <Form.Item name={name} rules={[{ required, message }]}>
      <Input type={type} prefix={icon} placeholder={placeholder} />
    </Form.Item>
  );
}
*/

export interface ILoginProps {
  login: (username: string, password: string) => Promise<any>;
}

export const NormalLoginForm: React.FC<ILoginProps> = ({ login }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  if (loading) return <FoldingCube />;

  const func = {
    onFinish: () => {
      form.validateFields().then(async (values) => {
        const { username, password } = values;
        setLoading(true);
        await login(username, password)
          .then((value) => logger.log('login info is', value))
          .finally(() => setLoading(false));
      });
    },
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
      <Form.Item>
        <FormInput
          name="username"
          message="Please input your username!"
          required
          type="input"
          placeholder="Username"
          prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
        />
      </Form.Item>
      <Form.Item>
        <FormInput
          name="password"
          message="Please input your password!"
          required
          type="password"
          placeholder="Password"
          prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};
