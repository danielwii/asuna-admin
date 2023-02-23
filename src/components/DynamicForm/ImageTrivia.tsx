import { UploadOutlined } from '@ant-design/icons';

import { Button, Input, List } from 'antd';
import * as _ from 'lodash';
import { join } from 'path';
import * as R from 'ramda';
import * as React from 'react';
import ReactCrop, { Crop, PercentCrop, PixelCrop } from 'react-image-crop';
import * as util from 'util';

import { valueToUrl } from '../../core/url-rewriter';
import { upload } from '../../helpers/upload';
import { createLogger } from '../../logger';
import { Asuna } from '../../types';
import { Title } from '../Styled';

const logger = createLogger('components:dynamic-form:image-trivia');

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
  crop: PixelCrop;
  percentageCrop: PercentCrop;
};

interface IProps {
  maxHeight?: number;
  maxWidth?: number;
  /**
   * @deprecated
   */
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

const DEFAULT_CROP: Crop = {
  width: 50,
  x: 0,
  y: 0,
  height: 50,
  unit: 'px',
};

export class ImageTrivia extends React.Component<IProps, IState> {
  state: IState = {
    updateIndex: null,
    crop: DEFAULT_CROP,
  };

  private imageRef: HTMLImageElement;
  private uploadElement: HTMLInputElement | null;

  onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      upload(e.target.files[0]).then((uploaded) => {
        const { onChange, urlHandler, prefix, value } = this.props;
        if (uploaded) {
          logger.log('[onSelectFile]', { props: this.props, state: this.state });
          const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
          let image = resolvedUrl;
          if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith(prefix || '')) {
            image = join(prefix || '', resolvedUrl);
          }
          logger.log('[onSelectFile]', { uploaded, image });
          onChange!(R.mergeDeepRight(value as ImageWithTags, { url: image }));
        }
      });
    }
  };

  onImageLoaded = (image: HTMLImageElement, pixelCrop: PixelCrop) => {
    logger.log('[onImageLoaded]', { image, pixelCrop });
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (/*crop.aspect && */ crop.height && crop.width) {
      this.setState({ crop: { ...crop, height: null as any } }, () => {
        logger.log('[onImageLoaded] done', this.state);
      });
    }
  };

  onCropComplete = (crop: PixelCrop, percentageCrop: PercentCrop) => {
    const { value } = this.props;
    const { updateIndex } = this.state;
    const tags = value?.tags || [];
    if (_.isNil(updateIndex)) {
      const latest = tags.length;
      this.setState({ updateIndex: latest });
      this._updateTagInfo(latest, { positionInfo: { crop, percentageCrop } });
    } else {
      this._updateTagInfo(updateIndex, { positionInfo: { crop, percentageCrop } });
    }
    logger.log('[onCropComplete]', { crop, percentageCrop, tags });
  };

  onCropChange = (crop: Crop) => {
    this.setState({ crop });
  };

  _add = () => {
    logger.log('_add', this.state);
    const { value, onChange } = this.props;
    const tags = value?.tags || [];
    onChange!(R.mergeDeepRight(value as ImageWithTags, { tags: tags.concat({} as any) } as any));
    this.setState({ updateIndex: tags.length, crop: DEFAULT_CROP });
  };

  _edit = (index: number) => {
    const { value } = this.props;
    logger.log('_edit', { index });
    this.setState({
      updateIndex: index,
      crop: value?.tags?.[index]?.positionInfo?.crop || DEFAULT_CROP,
    });
  };

  _updateTagInfo = (index: number, tag: Partial<Tag>) => {
    logger.log('_updateTagInfo', { index, info: tag });
    const { onChange, value } = this.props;
    if (value && value.tags) {
      const tags = _.get(value, 'tags') || [];
      tags[index] = tags[index] ? { ...tags[index], ...tag } : (tag as any as Tag);
      onChange!({ ...value, tags });
    } else {
      onChange!(R.mergeDeepRight(value as ImageWithTags, { tags: [tag] } as any));
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
    const url = valueToUrl(value?.url, { type: 'image', thumbnail: {} });

    logger.log('[render]', { value, crop });

    return (
      <div>
        <Button onClick={() => this.uploadElement!.click()}>
          <input hidden type="file" ref={(input) => (this.uploadElement = input)} onChange={this.onSelectFile} />
          <UploadOutlined /> Click to Upload
        </Button>
        <div className="asuna-image-crop">
          {value && (
            <ReactCrop
              style={{
                borderRadius: '5px',
                boxShadow: '0 2px 5px 0 rgba(0, 0, 0, .26)',
                maxHeight: maxHeight || DEFAULT_MAX_HEIGHT,
                maxWidth: maxWidth || DEFAULT_MAX_WEIGHT,
              }}
              // src={url}
              // onImageLoaded={this.onImageLoaded as any}
              crop={crop}
              onComplete={this.onCropComplete}
              onChange={this.onCropChange}
            >
              <img src={url} alt="" />
            </ReactCrop>
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
                        {index}::{util.inspect(item?.positionInfo)}
                      </pre>
                    </Title>
                  }
                />
                <Input.Group>
                  <Input
                    type="text"
                    addonBefore="Name: "
                    onChange={(e) => this._updateTagInfo(index, { name: e.target.value })}
                    value={item.name}
                  />
                  <Input
                    type="text"
                    addonBefore="Url: "
                    onChange={(e) => this._updateTagInfo(index, { url: e.target.value })}
                    value={item.url}
                  />
                </Input.Group>
              </List.Item>
            )}
          />
        )}
      </div>
    );
  }
}
