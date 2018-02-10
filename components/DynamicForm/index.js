import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import * as R    from 'ramda';
import { sha1 }  from 'object-hash';

import { Button, Card, Form } from 'antd';

import {
  generateAssociation,
  generateButton,
  generateCheckbox,
  generateDateTime,
  generateHidden,
  generateImage,
  generateImages,
  generateInput,
  generateInputNumber,
  generatePlain,
  generateRichTextEditor,
  generateSwitch,
  generateTextArea,
} from './elements';

import { createLogger } from '../../adapters/logger';

const logger = createLogger('components:dynamic-form');

// FIXME remove it
export const buildForm = (form, definitions) => definitions.map((definition) => {
  switch (definition.type) {
    case 'Input': {
      return generateInput(form, definition.config, definition.layout);
    }
    default:
      logger.warn('[buildForm]', `build form for type ${definition.type} not implemented.`);
  }
  return definition;
});

// FIXME remove it
class DynamicForm extends React.Component {
  static propTypes = {
    definitions: PropTypes.arrayOf(PropTypes.shape({})),
  };

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

export const DynamicFormTypes = {
  // --------------------------------------------------------------
  // Basic Types
  // --------------------------------------------------------------
  Checkbox   : 'Checkbox',
  Button     : 'Button',
  Hidden     : 'Hidden',
  Plain      : 'Plain',
  Input      : 'Input',
  InputNumber: 'InputNumber',
  TextArea   : 'TextArea',
  DateTime   : 'DateTime',
  Switch     : 'Switch',
  // --------------------------------------------------------------
  // Advanced Types
  // --------------------------------------------------------------
  Image      : 'Image',
  Images     : 'Images',
  Video      : 'Video',
  RichText   : 'RichText',
  Association: 'Association',
  ManyToMany : 'ManyToMany',
};

export class DynamicForm2 extends React.Component {
  static propTypes = {
    fields  : PropTypes.shape({}),
    auth    : PropTypes.shape({}),
    onSubmit: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(nextProps, nextState, nextContext: any): boolean {
    logger.info('[shouldComponentUpdate]', nextProps, nextState, nextContext);
    const { fields }      = nextProps;
    const nextFingerprint = sha1(fields);
    const shouldUpdate    = !R.equals(this.fingerprint, nextFingerprint);
    logger.info('[shouldComponentUpdate]', nextFingerprint, this.fingerprint, shouldUpdate);
    this.fingerprint = nextFingerprint;
    return shouldUpdate;
  }

  // TODO extract as a react Component
  buildField = (field, index) => {
    const { form, auth } = this.props;

    const options            = {
      ...field.options, key: field.key || field.name, name: field.name, auth,
    };
    const defaultAssociation = {
      name  : 'name',
      value : 'id',
      fields: ['id', 'name'],
    };

    logger.info('[DynamicForm2][buildField]', 'build field', field, 'field index is', index, 'option is', options);

    switch (field.type) {
      case DynamicFormTypes.Plain:
        return generatePlain({ key: index, label: options.name, text: field.value });
      case DynamicFormTypes.Input:
        return generateInput(form, options);
      case DynamicFormTypes.Checkbox:
        return generateCheckbox(form, options);
      case DynamicFormTypes.Button:
        return generateButton(form, options);
      case DynamicFormTypes.Hidden:
        return generateHidden(form, options);
      case DynamicFormTypes.InputNumber:
        return generateInputNumber(form, options);
      case DynamicFormTypes.TextArea:
        return generateTextArea(form, options);
      case DynamicFormTypes.DateTime:
        return generateDateTime(form, options);
      case DynamicFormTypes.Image:
        return generateImage(form, options);
      case DynamicFormTypes.Images:
        return generateImages(form, options);
      case DynamicFormTypes.Switch:
        return generateSwitch(form, options);
      case DynamicFormTypes.RichText:
        return generateRichTextEditor(form, options);
      case DynamicFormTypes.ManyToMany: {
        // --------------------------------------------------------------
        // ManyToMany RelationShip
        // --------------------------------------------------------------
        logger.info('[DynamicForm2][buildField][ManyToMany]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation } = R.path(['foreignOpts', 0])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          return generateAssociation(form, {
            ...options,
            items,
            mode    : 'multiple',
            getName : R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[buildField]', 'foreignOpts is required in association.');
        return <div>association need foreignOpts.</div>;
      }
      case DynamicFormTypes.Association: {
        // --------------------------------------------------------------
        // OneToMany / OneToOne RelationShip
        // --------------------------------------------------------------
        logger.info('[DynamicForm2][buildField][Association]', field);
        if (R.has('foreignOpts')(field)) {
          const { modelName, association = defaultAssociation } = R.path(['foreignOpts', 0])(field);

          const items = R.path(['associations', modelName, 'items'])(field);
          return generateAssociation(form, {
            ...options,
            items,
            getName : R.prop(association.name || defaultAssociation.name),
            getValue: R.prop(association.value || defaultAssociation.value),
          });
        }
        logger.warn('[buildField]', 'foreignOpts is required in association.');
        return <div>association need foreignOpts.</div>;
      }
      default:
        return (
          <div key={index}>
            DynamicForm2 `{field.type}-{options.type}-{options.key}` not implemented.
            <pre>{JSON.stringify(field)}</pre>
          </div>
        );
    }
  };

  buildFieldGroup = (fieldGroup, index) => {
    logger.info('[DynamicForm2][buildFieldGroup]', fieldGroup, 'group index is', index);
    return (
      <div>
        <Card key={index}>
          {_.map(fieldGroup, this.buildField)}
        </Card>
        {/* language=CSS */}
        <style jsx>{`
          div {
            margin-bottom: .5rem;
          }
        `}
        </style>
      </div>
    );
  };

  handleOnSubmit = (e) => {
    logger.info('[handleOnSubmit]', 'onSubmit', e);
    e.preventDefault();

    const { form, onSubmit } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        logger.error('[handleOnSubmit]', 'error occurred in form', values, err);
      } else {
        onSubmit(e);
      }
    });
  };

  render() {
    const { fields } = this.props;
    logger.log('[DynamicForm2][render]', 'props is', this.props, 'fields is', fields);

    /*
        const fieldGroups = R.compose(
          R.groupBy(R.pipe(R.prop('key'), R.split(/-/), arr => arr[0])),
          R.values,
        )(fields);
        const fieldGroup s= _.groupBy(fields, (field, key) => _.split(_.get(field, 'key'), '-'));
        logger.log('DynamicForm2 fields group is', fieldGroups);
    */

    // remove fields which type is not included
    const renderFields = _.map(_.filter(fields, field => !!field.type), this.buildField);

    return (
      <Form>
        {/* {_.map(fieldGroups, this.buildFieldGroup)} */}
        {/* {_.map(fields, this.buildField)} */}
        {renderFields}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            onClick={this.handleOnSubmit}
            // disabled={hasErrors(getFieldsError())}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
