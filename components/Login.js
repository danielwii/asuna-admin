import React from 'react';

import { Button, Form, Icon, Input } from 'antd';

import { authActions }  from '../store/auth.redux';
import { createLogger } from '../helpers/index';

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

class NormalLoginForm extends React.Component {
  handleSubmit = (e) => {
    e.preventDefault();
    logger.info('Dispatch is', this.props.dispatch);
    this.props.form.validateFields((err, values) => {
      if (!err) {
        logger.info('Received values of form: ', values);
        const { username, password } = values;
        this.props.dispatch(authActions.login(username, password));
      }
    });
  };

  render() {
    const { form } = this.props;

    const usernameInput = generateInput(form, 'username', 'input', true, 'Please input your username!', 'Username', 'user');
    const passwordInput = generateInput(form, 'password', 'password', true, 'Please input your Password!', 'Password', 'lock');

    return (
      <Form onSubmit={this.handleSubmit} className="login-form">
        <Form.Item>
          {usernameInput}
        </Form.Item>
        <Form.Item>
          {passwordInput}
        </Form.Item>
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
