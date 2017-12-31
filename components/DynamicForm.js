import React from 'react';

import { Form, Icon, Input } from 'antd';


export const generateInput = (form, {
  name,
  required = false,
  requiredMessage,
  placeholder = '',
  iconType,
}, formItemLayout = {
  labelCol  : { offset: 0, span: 4 },
  wrapperCol: { offset: 0, span: 12 },
}) => {
  const decorator = form.getFieldDecorator(name, { rules: [{ required, requiredMessage }] });
  let decorated;
  if (iconType) {
    decorated = decorator(<Input
      prefix={<Icon type={iconType} style={{ color: 'rgba(0,0,0,.25)' }} />}
      placeholder={placeholder}
    />);
  } else {
    decorated = decorator(<Input placeholder={placeholder} />);
  }
  return <Form.Item {...formItemLayout} label={name}>{decorated}</Form.Item>;
};

export const buildForm = (form, definitions) => definitions.map((definition) => {
  switch (definition.type) {
    case 'Input': {
      return generateInput(form, definition.config, definition.layout);
    }
    default:
      console.warn(`build form for type ${definition.type} not implemented.`);
  }
  return definition;
});

class DynamicForm extends React.Component {
  static propTypes = {};

  constructor(props) {
    super(props);

    // this.buildForm = this.buildForm.bind(this);
  }

  componentWillMount() {
  }

  render() {
    const { form, definitions } = this.props;
    return (
      <div>
        <h1>Dynamic form</h1>
        <hr />
        {buildForm(form, definitions)}
      </div>
    );
  }
}

export default Form.create()(DynamicForm);
