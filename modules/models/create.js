import React from 'react';

import {
  Form, Select, InputNumber, Switch, Radio,
  Slider, Button, Upload, Icon, Rate,
} from 'antd';

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 },
};

export default class extends React.Component {
  componentWillMount() {
  }

  render() {
    return (
      <div>
        <Button>保存</Button>
        <div>
          <Form>

          </Form>
        </div>
      </div>
    );
  }
}
