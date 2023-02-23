import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import useMount from 'react-use/lib/useMount';

interface IProps {
  validateFn;
  upload;
  value?: string;
  onChange?: (value) => void;
}

export const QuillEditor = ({ value, onChange, validateFn, upload }: IProps) => {
  const [editor, setEditor] = useState();

  useMount(() => {});

  useLogger('<[QuillEditor]>', editor);

  return (
    <>
      {/*<link rel="stylesheet" href="https://unpkg.com/react-quill@1.3.3/dist/quill.snow.css" />*/}
      <ReactQuill theme="snow" value={value} onChange={onChange} />
    </>
  );
};
