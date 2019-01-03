import React from 'react';
import util from 'util';
import _ from 'lodash';
import * as R from 'ramda';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import styled from 'styled-components';

import 'react-image-crop/dist/ReactCrop.css';
import { Input, List } from 'antd';
import { WithDebugInfo } from '@asuna-admin/helpers/debug';
import { upload } from '@asuna-admin/helpers/upload';
import { join } from 'path';
import { createLogger } from '@asuna-admin/logger';
import idx from 'idx';

const logger = createLogger('components:dynamic-form:image-trivia');

interface IHighlightTitle {
  highlight: boolean;
}
const Title = styled.span`
  font-weight: ${(props: IHighlightTitle) => (props.highlight ? 'bold' : 'inherit')};
`;

const DEFAULT_MAX_HEIGHT = 300;
const DEFAULT_MAX_WEIGHT = '100%';

export interface ImageWithTags {
  url: string;
  tags?: Tag[];
}

type Tag = {
  positionInfo?: CropInfo;
  name?: string;
  summary?: string;
  url?: string;
};

type CropInfo = {
  crop: Crop;
  pixelCrop: PixelCrop;
};

interface IProps {
  maxHeight?: number;
  maxWidth?: number;
  host?: string;
  prefix?: string;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  value?: ImageWithTags;
  onChange?: (image: ImageWithTags) => void;
}

interface IState {
  updateIndex: number | null; // 当前正在更新的 trivia
  crop: Crop;
}

const DEFAULT_CROP = { width: 50, x: 0, y: 0 };

export class ImageTrivia extends React.Component<IProps, IState> {
  state: IState = {
    updateIndex: null,
    crop: DEFAULT_CROP,
  };

  private imageRef: HTMLImageElement;

  onSelectFile = async e => {
    if (e.target.files && e.target.files.length > 0) {
      const { onChange, urlHandler, prefix, value } = this.props;
      const uploaded = await upload(e.target.files[0]);
      if (uploaded) {
        logger.log('[onSelectFile]', { props: this.props, state: this.state });
        const image = join(prefix || '', urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`);
        logger.log('[onSelectFile]', { uploaded, image });
        onChange!(R.mergeDeepRight(value, { url: image }));
      }
    }
  };

  onImageLoaded = (image: HTMLImageElement, pixelCrop: PixelCrop) => {
    logger.log('[onImageLoaded]', { image, pixelCrop });
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (crop.aspect && crop.height && crop.width) {
      this.setState({ crop: { ...crop, height: null as any } }, () => {
        logger.log('[onImageLoaded] done', this.state);
      });
    }
  };

  onCropComplete = (crop: Crop, pixelCrop: PixelCrop) => {
    const { value } = this.props;
    const { updateIndex } = this.state;
    const tags = idx(value, _ => _.tags) || [];
    if (_.isNil(updateIndex)) {
      const latest = tags.length;
      this.setState({ updateIndex: latest });
      this._updateTagInfo(latest, { positionInfo: { crop, pixelCrop } });
    } else {
      //   this.setState({});
      this._updateTagInfo(updateIndex, { positionInfo: { crop, pixelCrop } });
    }
    logger.log('[onCropComplete]', { crop, pixelCrop, tags });
  };

  onCropChange = (crop: Crop) => {
    this.setState({ crop });
  };

  _add = () => {
    logger.log('_add', this.state);
    const { value, onChange } = this.props;
    const tags = idx(value, _ => _.tags) || [];
    onChange!(R.mergeDeepRight(value, { tags: tags.concat({} as any) }));
    this.setState({ updateIndex: tags.length, crop: DEFAULT_CROP });
  };

  _edit = (index: number) => {
    const { value } = this.props;
    logger.log('_edit', { index });
    this.setState({
      updateIndex: index,
      crop: idx(value, _ => _.tags[index].positionInfo.crop) || DEFAULT_CROP,
    });
  };

  _updateTagInfo = (index: number, tag: Partial<Tag>) => {
    logger.log('_updateTagInfo', { index, info: tag });
    const { onChange, value } = this.props;
    if (value && value.tags) {
      const tags = _.get(value, 'tags') || [];
      tags[index] = tags[index] ? { ...tags[index], ...tag } : ((tag as any) as Tag);
      onChange!({ ...value, tags });
    } else {
      onChange!(R.mergeDeepRight(value, { tags: [tag] }));
    }
  };

  _remove = (index: number) => {
    const { value, onChange } = this.props;
    const { updateIndex } = this.state;
    if (value && value.tags) {
      value.tags.splice(index, 1);
      onChange!(value);
      logger.log('[_remove]', { index, value });
      // remove focus when old index is out of bounds
      if (_.gt(updateIndex, value.tags.length - 1)) {
        this.setState({ updateIndex: null, crop: DEFAULT_CROP });
      }
    }
  };

  render() {
    const { maxHeight, maxWidth, value } = this.props;
    const { crop, updateIndex } = this.state;

    logger.log('[render]', { value, crop });

    return (
      <WithDebugInfo info={this.state}>
        <div>
          <input type="file" onChange={this.onSelectFile} />
        </div>
        <div className="asuna-image-crop">
          {value && (
            <ReactCrop
              style={{
                borderRadius: '5px',
                boxShadow: '0 2px 5px 0 rgba(0, 0, 0, .26)',
                maxHeight: maxHeight || DEFAULT_MAX_HEIGHT,
                maxWidth: maxWidth || DEFAULT_MAX_WEIGHT,
              }}
              src={value.url}
              crop={crop}
              onImageLoaded={this.onImageLoaded as any}
              onComplete={this.onCropComplete}
              onChange={this.onCropChange}
            />
          )}
          {/* language=CSS */}
          <style jsx>{`
            .asuna-image-crop div {
              display: inline-flex;
              margin: 1rem;
            }
          `}</style>
        </div>
        {value && (
          <List
            dataSource={value.tags}
            loadMore={<a onClick={() => this._add()}>add tag</a>}
            renderItem={(item: Tag, index) => (
              <List.Item
                actions={[
                  <a onClick={() => this._edit(index)}>edit</a>,
                  <a onClick={() => this._remove(index)}>remove</a>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Title highlight={updateIndex === index}>
                      <pre>
                        {index}::{util.inspect(idx(item, _ => _.positionInfo))}
                      </pre>
                    </Title>
                  }
                />
                <Input.Group>
                  <Input
                    type="text"
                    addonBefore="Name: "
                    onChange={e => this._updateTagInfo(index, { name: e.target.value })}
                    value={item.name}
                  />
                  <Input
                    type="text"
                    addonBefore="Url: "
                    onChange={e => this._updateTagInfo(index, { url: e.target.value })}
                    value={item.url}
                  />
                </Input.Group>
              </List.Item>
            )}
          />
        )}
      </WithDebugInfo>
    );
  }
}
