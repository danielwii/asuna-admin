import React from 'react';

import { Button, Form, Icon, Input } from 'antd';

import Layout           from '../layout';
import { loginActions } from '../store/login.redux';

function generateInput(form, name, required, message, placeholder, iconType) {
  const decorator = form.getFieldDecorator(name, { rules: [{ required, message }] });
  if (iconType) {
    return decorator(<Input
      prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
      placeholder={placeholder}
    />);
  }
  return decorator(<Input placeholder={placeholder} />);
}

class NormalLoginForm extends React.Component {
  handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dispatch is', this.props.dispatch);
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        const { username, password } = values;
        loginActions.login(username, password)(this.props.dispatch);
      }
    });
  };

  render() {
    const { form } = this.props;

    const usernameInput = generateInput(form, 'username', true, 'Please input your username!', 'Username', 'user');
    const passwordInput = generateInput(form, 'password', true, 'Please input your Password!', 'Password', 'lock');

    return (
      <Layout>
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
      </Layout>
    );
  }
}

export default Form.create()(NormalLoginForm);
