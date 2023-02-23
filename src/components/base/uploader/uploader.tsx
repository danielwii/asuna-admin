/** @jsxRuntime classic */

/** @jsx jsx */
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  LeftOutlined,
  PictureOutlined,
  RightOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
} from '@ant-design/icons';
import { css, jsx } from '@emotion/react';

import { Button, Divider, Input, Radio, Tag, Upload } from 'antd';
import * as _ from 'lodash';
import React from 'react';
import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { WithDebugInfo } from '../debug/debug';
import { WithVariable } from '../helper/helper';
import { Loading } from '../loading';
import { AssetsPreview, ImagePreview, WithModal } from '../preview-button/asset-preview';
import { valueToArray, valueToString, wrapFilesToFileList } from './utils';

import type { UploadFile, UploadListType, UploadProps, UploadChangeParam, RcFile } from 'antd/es/upload/interface';
import type { AxiosRequestConfig } from 'axios';

export * from './utils';

export interface IUploadedFile {
  bucket: string;
  path: string;
  prefix: string;
  mimetype: string;
  mode: string;
  filename: string;
  fullpath: string;
  extension: string;
}

export interface UploaderAdapter {
  upload: (file: File, requestConfig?: AxiosRequestConfig) => Promise<IUploadedFile[]>;

  validate: (file: File) => boolean;
}

export interface IUploaderProps {
  adapter: UploaderAdapter;
  value: string | string[]; // 单图模式的图片地址，单图模式必须传，必填，string类型
  multiple?: boolean; // 是否启用多图上传模式，选填，默认false，boolean类型
  jsonMode?: boolean;

  enableDragMode?: boolean;
  // action?: string; // 图片上传的接口地址，必填，string类型
  disabled?: boolean; // 是否禁用上传功能，选填，默认false，boolean类型
  // formData?: Partial<IFormData>; // 上传图片大小尺寸
  // accept?: string; // 文件尺寸，多个以逗号分割，选填，默认：image/jpg,image/png,image/gif，string类型
  // size?: 'small' | 'default' | 'large'; // 上传组件样式大小，默认'default‘，string类型
  // fileList?: any[]; // 多图模式的图片地址集合，必填，格式为[{ value: '' }]，array类型
  // enableNetworkAddress?: boolean; // 是否使用网络地址功能，选填，默认false，boolean类型
  // onSuccess?: (response: any, fileList?: any[]) => void; // 成功事件回调，必填
  // onDelete?: (fileList?: any[]) => void; // 删除事件回调，必填
  // onMove?: (fileList?: any[]) => void; // 排序事件回调，必填
  onChange: (value: string | string[]) => void;
}

export const Uploader: React.FC<IUploaderProps> = ({
  adapter,
  value,
  disabled,
  multiple,
  jsonMode,
  enableDragMode,
  onChange,
}) => {
  // const [refreshFlag, updateRefreshFlag] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [layout, setLayout] = React.useState<UploadListType>('picture');
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);

  // if (value) console.table(valueToArray(value));

  React.useEffect(() => {
    if (_.isEmpty(fileList)) {
      setFileList(wrapFilesToFileList(value));
    }
  }, [value]);

  useLogger(Uploader.name, { loading, layout }, fileList);

  const func = {
    beforeUpload: ((file, files) => {
      if (disabled) {
        return false;
      }

      const validated = adapter.validate(file);
      if (file.type.indexOf('image/')) {
        // loadReaderAsync(file, this).catch(reason => console.error(reason));
      }

      // TODO return false to support upload on manual
      return validated;
    }) as UploadProps['beforeUpload'],
    customRequest: ((options) => {
      setLoading(true);
      // console.log('[customRequest]', options, fileList);

      const { file, onProgress, onSuccess, onError } = options;
      adapter
        .upload(file as RcFile, {
          onUploadProgress: ({ total, loaded }) =>
            (onProgress as any)({ percent: total ? Number(Math.round((loaded / total) * 100).toFixed(2)) : 0 }, file), // fixme type issue
        })
        .then(([uploaded]) => {
          // const combined = func.valueToSubmit(
          //   fileList.map((file) => file.url || _.get(file, 'response.fullpath')),
          //   uploaded.fullpath,
          // );
          // console.log('[customRequest]', fileList.length, { value, combined });
          // console.log('[customRequest]', fileList, wrapFilesToFileList(value), { value, uploaded, combined });
          // console.table((combined as string).split(','));
          // onChange(combined);

          // file['new'] = true;
          (onSuccess as any)(uploaded, file); // update status to done fixme type issue
          // setTimeout(() => updateRefreshFlag(refreshFlag + 1), fileList.length * 10);
        })
        .catch(onError)
        .finally(() => setLoading(false));
    }) as UploadProps['customRequest'],
    handleChange: (info: UploadChangeParam): void => {
      const uploads = _.filter(info.fileList, (file) => _.has(file, 'status'));
      const status = uploads.map((file: UploadFile) => file.status);
      const allDone = uploads.filter((file: UploadFile) => file.status === 'done').length === status.length;

      // console.log('[handleChange]', info, valueToArray(value), status, allDone);
      if (info.file && info.event?.percent === 100) {
        const inList = info.fileList.find(_.matches({ uid: info.file.uid }));
        if (inList && inList.status !== 'done') {
          inList.status = 'success';
        }
        if (!multiple) setFileList(_.takeRight(info.fileList));
        else setFileList([...info.fileList]); // update progress
      } else {
        // console.table(info.fileList);
        setFileList([...info.fileList]); // update progress
      }

      const responses = _.map(uploads, (upload) => ({ ...upload.response }));
      const files = _.map(fileList, (file) => ({ url: file.url, response: { ...file.response } }));
      if (allDone && uploads.length > 0) {
        const combined = func.valueToSubmit(
          _.map(files, (file) => file.url ?? file.response.fullpath),
          _.map(responses, (res) => res.fullpath),
        );
        onChange(combined);
      }
    },
    addNetworkAddress: (url: string): void => {
      setFileList([...fileList, ...wrapFilesToFileList(url)]);
      onChange(func.valueToSubmit(value, url));
    },
    handleDelete: (index: number): void => {
      setFileList(fileList.filter((item, i) => i !== index));

      const array = [...valueToArray(value)];
      array.splice(index, 1);
      onChange(func.valueToSubmit(valueToString(array, !!multiple, !!jsonMode)));
    },
    handleEdit: (index: number, newUrl: string): void => {
      // console.log('[handleEdit]', index, newUrl);
      const file = fileList.find((item, i) => i === index) as UploadFile;
      file.uid = newUrl;
      file.name = newUrl;
      file.url = newUrl;
      setFileList([...fileList]);

      const array = [...valueToArray(value)];
      array[index] = newUrl;
      onChange(func.valueToSubmit(value, valueToString(array, !!multiple, !!jsonMode)));
    },
    handleMove: (index: number, to: number): void => {
      const item = fileList.splice(index, 1);
      const [left, right] = [fileList.slice(0, to), fileList.slice(to)];
      const moved = _.uniq([...left, ...item, ...right]);
      setFileList(moved);
      onChange(func.valueToSubmit(value, valueToString(moved.map((file) => file.url) as any, !!multiple, !!jsonMode)));
    },
    valueToSubmit: (value?: string | string[], uploaded?: string | string[]): string | string[] => {
      const array = valueToArray(value ?? '');
      const uploadedArray = valueToArray(uploaded ?? '');
      let files: any = _.compact(_.uniq(_.flattenDeep([array, uploadedArray])));
      if (!multiple) files = _.takeRight(files);
      if (!jsonMode && _.isArray(files)) files = files.join(',');
      // console.log('[valueToSubmit]', files, { multiple, jsonMode });
      return files;
    },
  };

  const views = {
    renderedAddNetworkAddressButton: (
      <WithModal
        renderModal={({ state, setState, setVisible }) => (
          <div
            css={css`
              //margin: 1rem 0;
              text-align: right;
            `}
          >
            <div
              css={css`
                display: flex;
                justify-content: center;
                box-shadow: 0 0 1rem #ccc;
              `}
            >
              <img
                css={css`
                  max-width: 100%;
                `}
                src={state}
              />
            </div>
            <Divider type="horizontal" dashed style={{ margin: '1rem 0' }} />
            <Input.TextArea
              placeholder="请输入网络图片地址"
              value={state}
              onChange={(e) => setState(e.target.value)}
              autoSize
            />
            <Divider type="horizontal" dashed style={{ margin: '1rem 0' }} />
            <Button
              type="primary"
              size="small"
              onClick={() => {
                func.addNetworkAddress(state);
                setVisible(false);
              }}
            >
              Insert
            </Button>
          </div>
        )}
      >
        <Button size="small">
          <CloudUploadOutlined /> Add Network Address
        </Button>
      </WithModal>
    ),
  };

  return (
    <section
      className="small"
      css={css`
        margin: 0.2rem 0;
        .ant-upload-drag {
          display: inline-block;
          width: 20rem;
          height: 10rem;
          padding: 0 0.3rem;
          .ant-upload {
            //padding: .1rem;
          }
        }
        .ant-upload-list {
          margin-top: 1rem;
        }
        .upload-list-inline .ant-upload-animate-enter {
          animation-name: uploadAnimateInlineIn;
        }
        .upload-list-inline .ant-upload-animate-leave {
          animation-name: uploadAnimateInlineOut;
        }
      `}
    >
      {/* <Tag>{refreshFlag}</Tag> */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {views.renderedAddNetworkAddressButton}
        <Radio.Group size="small" value={layout} onChange={(e) => setLayout(e.target.value)}>
          <Radio.Button value="picture">
            picture <PictureOutlined />
          </Radio.Button>
          <Radio.Button value="picture-card">
            picture-card <UnorderedListOutlined />
          </Radio.Button>
        </Radio.Group>
      </div>
      <Divider type="horizontal" dashed={true} style={{ margin: '0.5rem 0' }} />
      {enableDragMode ? (
        <Upload.Dragger
          name="avatar"
          showUploadList
          listType={layout}
          customRequest={func.customRequest}
          fileList={fileList}
          disabled={disabled}
          multiple={multiple}
          beforeUpload={func.beforeUpload}
          onChange={func.handleChange}
        >
          {loading ? (
            <div style={{ display: 'inline-block' }}>
              <Loading type="chase" />
            </div>
          ) : (
            <React.Fragment>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <Button loading={loading} size="small">
                <UploadOutlined /> Click to Upload
              </Button>
            </React.Fragment>
          )}
        </Upload.Dragger>
      ) : (
        <Upload
          name="avatar"
          showUploadList
          listType={layout}
          customRequest={func.customRequest}
          fileList={fileList}
          disabled={disabled}
          multiple={multiple}
          beforeUpload={func.beforeUpload}
          onChange={func.handleChange}
        >
          {loading ? (
            <div style={{ display: 'inline-block' }}>
              <Loading type="chase" />
            </div>
          ) : (
            <Button size="small">
              <UploadOutlined /> upload
            </Button>
          )}
        </Upload>
      )}
      <Divider type="horizontal" dashed={true} style={{ margin: '0.5rem 0' }} />
      <div>
        <AssetsPreview
          urls={fileList.map((file) => file.url ?? _.get(file, 'response.fullpath') ?? file.thumbUrl)}
          fullWidth
          renderImage={({ view, index }) => (
            <div
              css={css`
                @keyframes pulse {
                  0% {
                    box-shadow: 0 0 0 0 rgba(204, 169, 44, 0.4);
                  }
                  70% {
                    box-shadow: 0 0 0 0.75rem rgba(204, 169, 44, 0);
                  }
                  100% {
                    box-shadow: 0 0 0 0 rgba(204, 169, 44, 0);
                  }
                }
                border-radius: 0.2rem;
                overflow: hidden;
                box-shadow: 0 0 1rem
                  ${_.cond([
                    [_.matches({ status: 'uploading' }), _.constant('yellow')],
                    [_.matches({ status: 'done', percent: 100 }), _.constant('green')],
                    [_.stubTrue, _.constant('transparent')],
                  ])(fileList[index])};
                animation: ${_.cond([
                  [_.matches({ status: 'uploading' }), _.constant('pulse 2s infinite')],
                  // [_.matches({ status: 'done' }), _.constant('ease-in infinite')],
                  [_.stubTrue, _.constant('none')],
                ])(fileList[index])};
              `}
            >
              {view}
            </div>
          )}
          renderExtraActions={(url, index, total) => (
            <WithVariable
              variable={{
                item: fileList[index],
                hasUrl: fileList[index].url || _.get(fileList[index], 'response.fullpath'),
                isHead: index === 0,
                isTail: index === total - 1,
              }}
            >
              {({ item, hasUrl, isHead, isTail }) => (
                <WithDebugInfo key={url} info={{ item, url }}>
                  <div>
                    <Button.Group size="small">
                      <Button type="primary" disabled={isHead} onClick={() => func.handleMove(index, 0)}>
                        <VerticalRightOutlined />
                      </Button>
                      <Button type="primary" disabled={isHead} onClick={() => func.handleMove(index, index - 1)}>
                        <LeftOutlined />
                      </Button>
                      <Button type="primary" disabled={isTail} onClick={() => func.handleMove(index, index + 1)}>
                        <RightOutlined />
                      </Button>
                      <Button type="primary" disabled={isTail} onClick={() => func.handleMove(index, total - 1)}>
                        <VerticalLeftOutlined />
                      </Button>
                    </Button.Group>{' '}
                    <div
                      css={css`
                        display: inline;
                        div {
                          display: inline;
                        }
                      `}
                      hidden={!hasUrl}
                    >
                      <ImagePreview url={url} onEdit={(newUrl) => func.handleEdit(index, newUrl)}>
                        <Button type="primary" icon={<EditOutlined />} size="small" />{' '}
                      </ImagePreview>
                    </div>
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={() => func.handleDelete(index)} />
                    <WithDebugInfo info={item} />
                  </div>
                  {item?.size && (
                    <Tag color="magenta" style={{ margin: '.2rem 0' }}>
                      {(item.size / 1024 / 1024).toFixed(3)}MB
                    </Tag>
                  )}
                </WithDebugInfo>
              )}
            </WithVariable>
          )}
        />
      </div>
      <Divider type="horizontal" dashed={true} style={{ margin: '0.5rem 0' }} />
    </section>
  );
};
