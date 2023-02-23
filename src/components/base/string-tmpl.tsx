/** @jsxRuntime classic */

/** @jsx jsx */
// noinspection ES6UnusedImports
import { css, jsx } from '@emotion/react';

import { Alert, Button, Col, Divider, Input, Row, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';

import { WithVariable } from './helper/helper';
import { MATCH_REGEX, Preview } from './preview-button/asset-preview';

const Editable: React.FC<
  React.PropsWithChildren<{
    text: string;
    type: 'input' | 'textarea';
    placeholder?: string;
    editing?: boolean;
  }>
> = ({ text, type, placeholder, editing, children, ...props }) => {
  // Manage the state whether to show the label or the input box. By default, label will be shown.
  // Exercise: It can be made dynamic by accepting initial state as props outside the component
  const [isEditing, setEditing] = useState(editing);

  // Event handler while pressing any key while editing
  const handleKeyDown = (event, type) => {
    // Handle when key is pressed
    const { key } = event;
    const keys = ['Escape', 'Tab'];
    const enterKey = 'Enter';
    const allKeys = [...keys, enterKey]; // All keys array

    /*
      - For textarea, check only Escape and Tab key and set the state to false
      - For everything else, all three keys will set the state to false
    */
    if ((type === 'textarea' && keys.includes(key)) || (type !== 'textarea' && allKeys.includes(key))) {
      setEditing(false);
    }
  };

  /*
  - It will display a label is `isEditing` is false
  - It will display the children (input or textarea) if `isEditing` is true
  - when input `onBlur`, we will set the default non edit mode
  Note: For simplicity purpose, I removed all the classnames, you can check the repo for CSS styles
  */
  return (
    <section
      // onBlur={() => setEditing(false)}
      {...props}
    >
      {isEditing ? (
        <div onKeyDown={(e) => handleKeyDown(e, type)}>
          <div style={{ marginBottom: '.5rem' }}>
            <i>
              press{' '}
              <Button danger size="small" onClick={() => setEditing(false)}>
                ESC
              </Button>{' '}
              to exit editing.
            </i>
          </div>
          {children}
        </div>
      ) : (
        <Tooltip title="click to edit" placement="topLeft">
          <div
            css={css`
              border: 1px dashed #d9d9d9;
              padding: 0.1rem;
            `}
            onClick={() => setEditing(true)}
          >
            {text ? (
              <pre
                css={css`
                  white-space: pre-wrap;
                  word-break: break-word;
                  max-height: 10rem;
                  max-width: 50%;
                  overflow-y: auto;
                  .tmpl__field {
                    background-color: whitesmoke;
                    line-height: 1.5rem;
                    border: 1px dashed #d9d9d9;
                    border-radius: 2px;
                    padding: 0.1rem 0.2rem;
                    margin: 0 0.1rem;
                  }
                `}
                dangerouslySetInnerHTML={{
                  __html: text.replace(MATCH_REGEX, `<span class="tmpl__field" ">$1</span>`),
                }}
              />
            ) : (
              <pre>{placeholder || 'writing tmpl content here...'}</pre>
            )}
          </div>
        </Tooltip>
      )}
    </section>
  );
};

export const StringTmpl: React.FC<{
  tmpl: string;
  fields: { name: string; help?: string; fake?: string }[];
  onChange: (tmpl) => void;
  jsonMode?: boolean;
  htmlMode?: boolean;
}> = ({ tmpl, fields, onChange, jsonMode, htmlMode }) => {
  let ref;
  let pos;
  const [error, setError] = React.useState<Error | null>();

  useEffect(() => {
    try {
      if (tmpl && jsonMode) JSON.parse(tmpl);
      setError(null);
    } catch (e) {
      setError(e);
    }
  }, [tmpl]);

  const func = {
    insert: ({ name }: { name: string }) => {
      const updateTo = `${tmpl.slice(0, pos)}{{${name}}}${tmpl.slice(pos + 1)}`;
      onChange(updateTo);
      ref.focus();
    },
  };

  return (
    <Row gutter={12}>
      <Col span={12}>
        <Editable text={tmpl} type="textarea">
          <Input.TextArea
            ref={(node) => (ref = node)}
            autoSize
            autoFocus
            value={tmpl}
            onSelect={(event) => (pos = event.currentTarget.selectionStart)}
            onChange={(e) => onChange(e.target.value)}
          />
          <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />
          <div
            css={css`
              button {
                margin: 0.1rem;
              }
            `}
          >
            {fields?.map((field) => (
              <WithVariable
                key={field.name}
                variable={
                  <Button type="dashed" size="small" onClick={() => func.insert(field)}>
                    {field.name}
                  </Button>
                }
              >
                {(rendered) =>
                  field.help ? (
                    <Tooltip
                      title={
                        <div>
                          {field.help}
                          {field.fake && <div>{`[fake=${field.fake}]`}</div>}
                        </div>
                      }
                    >
                      {rendered}
                    </Tooltip>
                  ) : (
                    rendered
                  )
                }
              </WithVariable>
            ))}
          </div>
        </Editable>
      </Col>
      <Col span={12}>
        <Preview text={tmpl} tmplFields={fields} jsonMode={jsonMode} htmlMode={htmlMode} />
      </Col>

      {error && <Alert message={error.message} type="error" showIcon />}
    </Row>
  );
};
