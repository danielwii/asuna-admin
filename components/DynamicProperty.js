import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import styled    from 'styled-components';

import { Button, Divider, Form, Icon, List } from 'antd';

import { createLogger } from '../adapters/logger';

import { DynamicForm2, DynamicFormTypes } from '../components/DynamicForm';

const logger = createLogger('components:dynamic-property');

export const inspectElementTypes = {
  Type    : 'Type',
  Text    : 'Text',
  Checkbox: 'Checkbox',
};

export const propertyTypes = {
  String: {
    type      : 'String',
    name      : '文本框',
    inspection: [
      {
        type: inspectElementTypes.Type,
        key : 'type',
        name: '类型',
      },
      {
        type: inspectElementTypes.Text,
        key : 'name',
        name: '名称',
      },
      {
        type: inspectElementTypes.Checkbox,
        key : 'required',
        name: '必填',
      },
    ],
    editForm  : [
      {
        key  : 'name',
        name : '名称',
        type : DynamicFormTypes.Input,
        value: null,
      },
    ],
    // @deprecated 采用 view 和 config 区分展示和操作。
    // group : [{
    //   key  : 'name',
    //   name : '名称',
    //   type : DynamicFormTypes.Input,
    //   value: null,
    // }, {
    //   key  : 'required',
    //   name : '必填',
    //   type : DynamicFormTypes.Checkbox,
    //   value: null,
    // }],
  },
  Text  : { key: 'Text', name: '长文本框' },
};

const StyledFlexContainer       = styled.div`
  display: flex;
  margin: 1rem;
  justify-content: space-evenly;
`;
const StyledConfigContainer     = styled.div`
  margin-right: 1rem;
  flex-grow: 1;
`;
const StyledContentContainer    = styled.div`
  flex-grow: 2;
`;
const StyledComponentsContainer = styled.div`
  flex-basis: 8rem;
  margin-left: 1rem;
  button {
    width: 100%;
  }
`;

const StyledInspectionContainer = styled.div`
  position: relative;
`;
const StyledInspectionButtons   = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  button {
    margin: 0 .1rem;
  }
`;

export class DynamicProperty extends React.Component {
  static propTypes = {
    onAddProperty   : PropTypes.func.isRequired,
    onRemoveProperty: PropTypes.func.isRequired,
    properties      : PropTypes.arrayOf(PropTypes.shape({})),
  };

  constructor(props) {
    super(props);

    this.state = { toBeEdited: {} };
  }

  addProperty = (property) => {
    logger.log('add property', property);
    const { onAddProperty } = this.props;
    onAddProperty(property);
  };

  removeProperty = (property) => {
    logger.log('remove property', property);
    const { onRemoveProperty } = this.props;
    onRemoveProperty(property);
  };

  editProperty = (property) => {
    this.setState({ toBeEdited: property });
  };

  buildOption = (property, key) => (
    <div key={key}>
      <Button onClick={() => this.addProperty({ ...property })}>
        <Icon type="plus" />
        {property.name}
      </Button>
      {/* language=CSS */}
      <style jsx>{`
        div {
          margin-bottom: .5rem;
        }
      `}
      </style>
    </div>
  );

  buildInspectionElements = (property) => {
    logger.log('build elements', property);
    return _.map(property.inspection, (element) => {
      switch (element.type) {
        case inspectElementTypes.Type:
          return <div>{element.name}: {property.name}</div>;
        // case inspectElementTypes.Text:
        //   return <div>{element.name}: {element.value}</div>;
        case inspectElementTypes.Checkbox:
          // return <Checkbox defaultChecked={element.value} readonly>{element.name}</Checkbox>;
          return <div>{element.name}: <Icon type={element.value ? 'check' : 'close'} /></div>;
        default:
          return <div>{element.name}: {element.value}</div>;
      }
    });
  };

  buildInspection = (property) => {
    switch (property.type) {
      case propertyTypes.String.type:
        return (
          <StyledInspectionContainer>
            <div>{this.buildInspectionElements(property)}</div>
            <StyledInspectionButtons>
              <Button shape="circle" size="small" onClick={() => this.editProperty(property)}>
                <Icon type="edit" style={{ fontSize: 16 }} />
              </Button>
              <Button type="danger" shape="circle" size="small">
                <Icon type="close" style={{ fontSize: 16 }} />
              </Button>
            </StyledInspectionButtons>
            <hr />
          </StyledInspectionContainer>
        );
      default:
        return <List.Item>{JSON.stringify(property)}</List.Item>;
    }
  };

  buildInspections = (properties) => {
    logger.log('build inspects', properties);
    return <List dataSource={properties} renderItem={this.buildInspection} />;
  };

  render() {
    const { toBeEdited } = this.state;
    const { properties } = this.props;

    // const propertiesFields = _
    //   .chain(properties)
    //   .flatMap((property, index) => _.flatMap([
    //     ...property.group,
    //     // add remove button
    //     {
    //       key    : 'remove',
    //       name   : 'remove',
    //       options: { type: 'danger', onClick: this.removeProperty },
    //       type   : DynamicFormTypes.Button,
    //     },
    //   ], (group) => {
    //     const key = `${index}-${property.key}-${group.key}`;
    //     return {
    //       [key]: {
    //         key,
    //         name   : group.name,
    //         type   : DynamicFormTypes[group.type],
    //         value  : group.value,
    //         options: group.options,
    //       },
    //     };
    //   }))
    //   .reduce((fields, field) => ({ ...fields, ...field }), {})
    //   .value();
    //
    // logger.log('fields chain is', propertiesFields);
    //
    // const PropertiesForm = Form.create({
    //   mapPropsToFields({ fields }) {
    //     logger.log('fields is', fields);
    //     const results = _.flatMap(fields, field => Form.createFormField(field));
    //     logger.log('results is', results);
    //     return results;
    //     // return {
    //     //   title: Form.createFormField({ ...fields.title }),
    //     // };
    //   },
    // })(DynamicForm2);

    logger.log('toBeEdited is', toBeEdited);
    const fields = _
      .chain(toBeEdited.editForm)
      .map(editable => ({
        [editable.key]: {
          key    : editable.key,
          name   : editable.name,
          type   : DynamicFormTypes[editable.type],
          value  : 'test',
          options: editable.options,
        },
      }))
      .reduce((merged, editable) => ({ ...merged, ...editable }), {})
      .value();
    logger.log('fields is', fields);
    const EditFormWrapper = Form.create({
      mapPropsToFields(props) {
        logger.log('edit form props is', props);
        return _.flatMap(fields, field => Form.createFormField(field));
      },
    })(DynamicForm2);

    return (
      <React.Fragment>
        {/* <Sticky topOffset={80} relative="true"> */}
        {/* { props => (<div>Hello Kitty!</div>) } */}
        {/* </Sticky> */}
        <p>...properties</p>
        <Divider dashed>Properties</Divider>
        <StyledFlexContainer ref={(node) => {
          this.container = node;
        }}
        >
          <StyledConfigContainer>
            <EditFormWrapper fields={fields} />
          </StyledConfigContainer>

          <StyledContentContainer>
            {this.buildInspections(properties)}
            {/* {_.map(properties, this.buildInspect)} */}
            {/* <PropertiesForm fields={propertiesFields} /> */}
          </StyledContentContainer>

          <StyledComponentsContainer>
            {_.map(propertyTypes, this.buildOption)}
          </StyledComponentsContainer>
        </StyledFlexContainer>

        <Divider dashed>Relations</Divider>
        <StyledFlexContainer>
          <StyledContentContainer>Hello kitty.</StyledContentContainer>
          <StyledComponentsContainer>Hello world.</StyledComponentsContainer>
        </StyledFlexContainer>

        {/* <pre>{JSON.stringify(propertiesFields, null, 2)}</pre> */}
        <pre>{JSON.stringify(properties, null, 2)}</pre>
      </React.Fragment>
    );
  }
}
