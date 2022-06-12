/** @jsxRuntime classic */

/** @jsx jsx */
import { css, jsx } from '@emotion/react';

import _ from 'lodash';
import React, { useRef } from 'react';
import { createReducerContext, useLogger, useToggle } from 'react-use';

import { withP } from '../helper/helper';
import { AsunaTableProps } from './interface';

const reducer = (prev: { id: number; looseFocus: () => void }, next: { id: number; looseFocus: () => void }) => {
  console.log('reducer', { prev, next });
  if (prev && prev.id !== next.id) {
    prev.looseFocus();
  }
  return next;
};
const [useFocusedFunc, FocusedFuncProvider] = createReducerContext(reducer as any, null);

export const AsunaTable: React.FC<AsunaTableProps> = ({ columns, dataSource, onChange }) => {
  return (
    <FocusedFuncProvider>
      hi there!
      <div
        css={css`
          display: grid;
          //grid-template-columns: minmax(2rem, 1fr) minmax(2rem, 1fr);
          grid-template-columns: ${_.map(columns, () => 'minmax(2rem, 1fr)').join(' ')};
          //grid-template-rows: auto;
          //grid-template-areas:
          //  'header header header header'
          //  'main main . sidebar'
          //  'footer footer footer footer';
        `}
      >
        <React.Fragment
        // css={css`
        //   > div {
        //     //grid-area: header;
        //   }
        // `}
        >
          {_.map(columns, (column) => (
            <div
              css={css`
                text-align: center;
              `}
              key={column.name}
            >
              {column.title ?? column.name}
            </div>
          ))}
        </React.Fragment>
        <React.Fragment
        // css={css`
        //   > div {
        //     //grid-area: main;
        //   }
        // `}
        >
          {_.map(dataSource, (item, index) => (
            <RowRender
              key={index} // primary key
              record={item}
              columns={columns}
              onChange={(value) => {
                const copied = [...dataSource];
                copied[index] = value;
                onChange(copied);
              }}
            />
          ))}
        </React.Fragment>
      </div>
    </FocusedFuncProvider>
  );
};

const RowRender: React.FC<{ record: object; onChange: (o: object) => void } & Pick<AsunaTableProps, 'columns'>> = ({
  record,
  columns,
  onChange,
}) => {
  return (
    <React.Fragment>
      {_.map(columns, (column, index) =>
        withP(record[column.name], (value) => (
          <ColumnRender
            key={index}
            type={column.type}
            value={value}
            onChange={(v) => onChange({ ...record, [column.name]: v })}
          />
        )),
      )}
    </React.Fragment>
  );
};

const ColumnRender: React.FC<{ type: 'text'; value: string; onChange: (value) => void }> = ({
  type,
  value,
  onChange,
}) => {
  const build = () => {
    switch (type) {
      case 'text':
        return <EditableText value={value} onChange={onChange} />;
      default:
        return <div>{JSON.stringify({ type, value })}</div>;
    }
  };
  return (
    <div
      css={css`
        background-color: #f5f6f8;
        padding: 4px 8px;
        margin: 1px;
      `}
    >
      {build()}
    </div>
  );
};

const EditableText: React.FC<{ value: string; onChange: (value) => void }> = ({ value, onChange }) => {
  const ref = useRef();
  const [, setFunc] = useFocusedFunc();
  const [isEdit, toggle] = useToggle(false);

  const func = {
    looseFocus: () => {
      console.log('looseFocus ...');
      if (ref.current) (ref.current as any).textContent = value; // reset content of div
      toggle(false);
    },
  };

  useLogger('EditableText', { isEdit, value });

  if (isEdit) {
    return (
      <div
        ref={ref as any}
        css={css`
          border: 1px black dashed;
          margin: -1px;
          background-color: white;
        `}
        contentEditable
        // suppressContentEditableWarning
        onKeyPress={(e) => {
          console.log(e.key);
          if (/enter/i.test(e.key)) {
            onChange(e.currentTarget.innerText);
            toggle(false);
          }
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return (
    <div
      css={css`
        cursor: text;
        :hover {
          border: 1px black dashed;
          margin: -1px;
        }
      `}
      onClick={() => {
        toggle(true);
        setFunc({ ...func, id: Date.now() });
      }}
    >
      {value}
    </div>
  );
};
