// import 'codemirror/addon/comment/comment';
// import 'codemirror/addon/display/autorefresh';
// import 'codemirror/addon/edit/matchbrackets';
// import 'codemirror/keymap/sublime';
// import 'codemirror/mode/htmlmixed/htmlmixed';
// import 'codemirror/theme/monokai.css';

import { FormOutlined, Html5Outlined } from '@ant-design/icons';

import { Alert, Button, Radio, Space } from 'antd';
import { format } from 'prettier';
import parserHtml from 'prettier/parser-html';
import React, { useState } from 'react';
import useMount from 'react-use/lib/useMount';
import useNumber from 'react-use/lib/useNumber';

const LazyQuillEditor = React.lazy(() => import('./quill'));
const LazyTinyMCE = React.lazy(() => import('./tinymce'));

export type RichEditorProps = { value: string; onChange: (value: string) => any; validateFn; upload };
export const RichEditor = ({ value, onChange, validateFn, upload }: RichEditorProps): JSX.Element => {
  const [tabIndex, { set }] = useNumber(2);
  const [state, setState] = useState(format(value ?? '', { parser: 'html', plugins: [parserHtml] }));

  useMount(() => set(0));

  const view =
    typeof window !== 'undefined' ? (
      <>
        <div style={{ display: tabIndex === 0 ? 'inherit' : 'none' }}>
          <React.Suspense>
            <LazyQuillEditor value={value} onChange={onChange} upload={upload} validateFn={validateFn} />
          </React.Suspense>
        </div>
        {tabIndex === 1 && (
          <React.Suspense>
            <LazyTinyMCE value={value} onChange={onChange} upload={upload} validateFn={validateFn} />
          </React.Suspense>
        )}
        <div style={{ display: tabIndex === 2 ? 'inherit' : 'none' }}>
          <Alert type="info" showIcon message="Not implemented" />
          {/*
          <CodeMirror
            value={state}
            options={{ theme: 'monokai', lineNumbers: true, tabSize: 2, keyMap: 'sublime', mode: 'htmlmixed' }}
            onBeforeChange={(editor, data, updateTo) => setState(updateTo)}
          />
          <Divider type="horizontal" style={{ margin: '.5rem 0' }} />*/}
          <Button type="dashed" onClick={() => onChange(state)}>
            更新
          </Button>
        </div>
      </>
    ) : null;

  return (
    <Space direction="vertical">
      <Radio.Group size="small" value={tabIndex} onChange={(e) => set(e.target.value)}>
        <Radio.Button value={0}>
          Legacy <FormOutlined />
        </Radio.Button>
        <Radio.Button value={1}>
          Cloud <Html5Outlined />
        </Radio.Button>
        <Radio.Button disabled>
          HTML(TBD) <Html5Outlined />
        </Radio.Button>
      </Radio.Group>

      {/*<AdvancedButton
        title="编辑"
        width={1200}
        builder={({ onOk, cancel }) => (
          <InlineEditor value={value} onChange={onChange} upload={upload} validateFn={validateFn} />
        )}
      >
        Edit
      </AdvancedButton>*/}
      {/*<QuillEditor value={value} onChange={onChange} upload={upload} validateFn={validateFn} />*/}
      {/*<InlineEditor value={value} onChange={onChange} upload={upload} validateFn={validateFn} />*/}
      {view}
    </Space>
  );
};

export default RichEditor;
