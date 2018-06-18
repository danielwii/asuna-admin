import React from 'react';

import { Button, Form, Icon, Input } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';

import { createLogger } from '../helpers';

const logger = createLogger('components:login', 'warn');

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

interface IProps {
  form: WrappedFormUtils;
  login: (username: string, password: string, callback: (response) => void) => void;
}

interface IState {
  loading: true | false;
}

class NormalLoginForm extends React.Component<IProps, IState> {
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

export default Form.create()(NormalLoginForm);
