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
  positionInfo: CropInfo;
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
  src: string | ArrayBuffer | null;
  updateIndex: number | null; // 当前正在更新的 trivia
  pixelCrops: Tag[];
  crop: Crop;
}

export class ImageTrivia extends React.Component<IProps, IState> {
  state: IState = {
    src: null,
    updateIndex: null,
    pixelCrops: [],
    crop: { width: 50, x: 0, y: 0 },
  };

  static getDerivedStateFromProps(nextProps: IProps, prevState: IState) {
    return nextProps.value ? { src: nextProps.value.url, pixelCrops: nextProps.value.tags } : null;
  }

  private imageRef: HTMLImageElement;

  onSelectFile = async e => {
    if (e.target.files && e.target.files.length > 0) {
      const { onChange, urlHandler, prefix, value } = this.props;
      const uploaded = await upload(e.target.files[0]);
      if (uploaded) {
        logger.log('[onSelectFile]', { props: this.props, state: this.state });
        const image = join(prefix || '', urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`);
        logger.log('[onSelectFile]', { uploaded, image });
        onChange!(R.mergeDeepRight(this.props.value, { url: image }));
      }
    }
  };

  onImageLoaded = (image: HTMLImageElement, pixelCrop: PixelCrop) => {
    logger.log('[onImageLoaded]', { image, pixelCrop });
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (crop.aspect && crop.height && crop.width) {
      this.setState({ crop: { ...crop, height: null as any } });
    }
  };

  onCropComplete = (crop: Crop, pixelCrop: PixelCrop) => {
    const { updateIndex, pixelCrops } = this.state;
    if (_.isNil(updateIndex)) {
      const latest = pixelCrops.length;
      this.setState({
        updateIndex: latest,
        pixelCrops: [...pixelCrops, { positionInfo: { crop, pixelCrop } }],
      });
      this._updateTagInfo(latest, pixelCrops[latest]);
    } else {
      pixelCrops[updateIndex] = { ...pixelCrops[updateIndex], positionInfo: { crop, pixelCrop } };
      this.setState({});
      this._updateTagInfo(updateIndex, pixelCrops[updateIndex]);
    }
    logger.log('[onCropComplete]', { crop, pixelCrop, pixelCrops: this.state.pixelCrops });
  };

  onCropChange = (crop: Crop) => {
    this.setState({ crop });
  };

  _add = () => {
    this.setState({
      updateIndex: this.state.pixelCrops.length,
      pixelCrops: this.state.pixelCrops.concat({} as Tag),
    });
  };

  _edit = (index: number) => {
    this.setState({ updateIndex: index, crop: this.state.pixelCrops[index].positionInfo.crop });
  };

  _updateTagInfo = (index: number, tag: Partial<Tag>) => {
    logger.log({ index, info: tag });
    const { onChange } = this.props;
    const tags = idx(this.props.value, _ => _.tags);
    if (tags) {
      if (tags[index]) {
        tags[index] = tags[index] ? R.mergeDeepRight(tags[index], { ...tag }) : null;
        logger.log(this.props, this.state, tags);
        onChange!(R.mergeDeepRight(this.props.value, { tags }));
      }
    } else {
      logger.log(this.props, this.state, tag);
      onChange!(R.mergeDeepRight(this.props.value, { tags: [tag] }));
    }
  };

  _remove = (index: number) => {
    const { pixelCrops } = this.state;
    pixelCrops.splice(index, 1);
    this.setState({ updateIndex: null });
    logger.log('[_remove]', { index, pixelCrops: this.state.pixelCrops });
  };

  render() {
    const { maxHeight, maxWidth, value } = this.props;
    const { crop, pixelCrops, src, updateIndex } = this.state;

    logger.log('[render]', { value, crop, pixelCrops: this.state.pixelCrops });

    return (
      <WithDebugInfo info={this.state}>
        <div>
          <input type="file" onChange={this.onSelectFile} />
        </div>
        <div className="asuna-image-crop">
          {src && (
            <ReactCrop
              style={{
                borderRadius: '5px',
                boxShadow: '0 2px 5px 0 rgba(0, 0, 0, .26)',
                maxHeight: maxHeight || DEFAULT_MAX_HEIGHT,
                maxWidth: maxWidth || DEFAULT_MAX_WEIGHT,
              }}
              src={src as string}
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
        <List
          dataSource={pixelCrops}
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
                    <pre>{util.inspect(idx(item, _ => _.positionInfo))}</pre>
                  </Title>
                }
              />
              <Input.Group>
                <Input
                  type="text"
                  addonBefore="Name: "
                  onChange={e => this._updateTagInfo(index, { name: e.target.value })}
                  value={item.name}
                  required
                />
                <Input
                  type="text"
                  addonBefore="Url: "
                  onChange={e => this._updateTagInfo(index, { url: e.target.value })}
                  value={item.url}
                  required
                />
              </Input.Group>
            </List.Item>
          )}
        />
      </WithDebugInfo>
    );
  }
}
