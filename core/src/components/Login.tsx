import { createLogger } from '@asuna-admin/logger';

import { Button, Form, Icon, Input } from 'antd';
import { FormComponentProps } from 'antd/es/form/Form';
import React from 'react';

const logger = createLogger('components:login');

// TODO using DynamicForm's component instead
function generateInput(form, name, type, required, message, placeholder, iconType) {
  const decorator = form.getFieldDecorator(name, { rules: [{ required, message }] });
  if (iconType) {
    return decorator(
      <Input
        type={type}
        prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
        placeholder={placeholder}
      />,
    );
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

    if (loading) {
      return <div>login... &gt;__________,.&lt;</div>;
    }

    const usernameInput = generateInput(
      form,
      'username',
      'input',
      true,
      'Please input your username!',
      'Username',
      'user',
    );
    const passwordInput = generateInput(
      form,
      'password',
      'password',
      true,
      'Please input your Password!',
      'Password',
      'lock',
    );

    logger.debug('[render]', { usernameInput, passwordInput });

    return (
      <Form onSubmit={this.handleSubmit} className="login-form">
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

const Login = Form.create<ILoginProps>()(NormalLoginForm) as any;

export { Login };
