import { UploadOutlined } from '@ant-design/icons';

import { Button, Input, Upload, Divider } from 'antd';
import { RcFile, UploadChangeParam, UploadFile, UploadFileStatus, UploadProps } from 'antd/es/upload/interface';
import * as _ from 'lodash';
import * as fp from 'lodash/fp';
import * as React from 'react';
import videojs from 'video.js';

import { valueToArrays, valueToUrl } from '../../core/url-rewriter';
import { upload, validateFile } from '../../helpers/upload';
import { createLogger } from '../../logger';
import { Asuna } from '../../types';

const logger = createLogger('components:dynamic-form:video');

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

export interface IProps {
  bucket?: string;
  value?: string;
  multi?: boolean;
  onChange?: (value: any) => void;
  urlHandler?: (res: Asuna.Schema.UploadResponse) => string;
  jsonMode?: boolean;
}

export class VideoUploader extends React.Component<IProps> {
  prop = { multi: false };

  state = {
    fileList: VideoUploader.wrapVideosToFileList(this.props.value),
  };

  handleChange = (info: UploadChangeParam): void => {
    logger.log('[VideoUploader][handleChange]', { info });
    const { onChange, jsonMode } = this.props;
    // const images = _.compact(info.fileList.map(file => file.url)).join(',');
    // 这里只有 status 为 done 的 image 包含 url
    let videos: string | string[] = _.compact(_.flatten(info.fileList.map((file) => file.url)));
    if (!jsonMode && _.isArray(videos)) {
      videos = videos.join(',');
    }
    logger.log('[VideoUploader][handleChange]', { videos });
    onChange!(videos);
    this.setState({ fileList: info.fileList });
  };

  static wrapVideosToFileList = (videosInfo?: string | string[]): UploadFile[] => {
    const videos = valueToArrays(videosInfo);
    const fileList = _.flow([
      fp.filter<string>((video) => typeof video !== 'object'),
      fp.map<string, Partial<UploadFile>>((video) => {
        return {
          uid: `${video}`,
          status: 'done' as UploadFileStatus,
          name: valueToUrl(video, { type: 'video' }),
          url: valueToUrl(video, { type: 'video' }),
          // size: option?.file.size || 0,
          // type: option?.file.type || '',
          // thumbUrl: valueToUrl(video, { type: 'video' }),
        };
      }),
    ])(videos);
    logger.log('[wrapVideosToFileList]', 'fileList is', fileList);
    return fileList;
  };

  valueToSubmit = (value?: string | string[], extra?: string): string | string[] => {
    const { multi, jsonMode } = this.props;
    const uploadedVideos = valueToArrays(value);
    let videos: string | string[] = _.compact(_.flattenDeep([uploadedVideos, extra]));
    if (!multi) {
      videos = _.takeRight(videos);
    }
    if (!jsonMode && _.isArray(videos)) {
      videos = videos.join(',');
    }
    logger.log('[VideoUploader][valueToSubmit]', { value, extra, videos, multi, jsonMode, uploadedVideos });
    return videos;
  };

  customRequest = (({ file }) => {
    logger.log('[VideoUploader][customRequest]', file);
    const { onChange, urlHandler, bucket, jsonMode } = this.props;
    upload(file, {}, { bucket }).then((uploaded) => {
      if (uploaded) {
        logger.log('[VideoUploader][customRequest]', { props: this.props, state: this.state });
        const resolvedUrl = urlHandler ? urlHandler(uploaded[0]) : `${uploaded[0]}`;
        const videos = this.valueToSubmit(this.props.value, resolvedUrl);
        logger.log('[VideoUploader][customRequest]', { uploaded, videos });
        onChange!(videos);
        this.setState({ fileList: VideoUploader.wrapVideosToFileList(videos) });
      }
    });
  }) as UploadProps['customRequest'];

  renderPlayer = (video?: string) => {
    logger.debug('[VideoUploader][renderPlayer]', video);

    if (video) {
      const videoJsOptions = {
        // width   : '100%',
        // height  : 320,
        autoplay: false,
        controls: true,
        sources: [{ src: valueToUrl(video, { type: 'video' }), type: 'video/mp4' }],
      };
      return <VideoPlayer key={video} {...videoJsOptions} />;
    }
    return null;
  };

  render() {
    const { onChange, value: videos } = this.props;
    const { fileList } = this.state;

    const props: UploadProps = {
      onChange: this.handleChange,
      multiple: false,
      customRequest: this.customRequest,
      supportServerRender: true,
      beforeUpload: (file: RcFile, rcFiles: RcFile[]) => validateFile(file),
    };

    return (
      <div>
        <Upload {...props} fileList={fileList}>
          <Button>
            <UploadOutlined /> upload
          </Button>
        </Upload>
        <Divider type="horizontal" dashed style={{ margin: '0.5rem 0' }} />
        {_.isArray(videos) ? _.map(videos || [], this.renderPlayer) : this.renderPlayer(videos)}
        <Input.TextArea
          value={typeof videos === 'string' ? videos : videos ? JSON.stringify(videos) : ''}
          autoSize={{ minRows: 2, maxRows: 6 }}
          onChange={(event) => {
            logger.debug('[onChange]', event);
            this.props.onChange!(this.valueToSubmit(event.target.value));
            this.setState({ fileList: VideoUploader.wrapVideosToFileList(event.target.value) });
          }}
        />
      </div>
    );
  }
}

export class VideoPlayer extends React.Component {
  player: videojs.Player;
  videoNode: any;

  componentDidMount() {
    // instantiate Video.js
    this.player = videojs(this.videoNode, this.props as videojs.PlayerOptions, () => {
      logger.log('[componentDidMount]', 'onPlayerReady', this);
    });
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      logger.log('[componentWillUnmount]', 'call player dispose');
      // this.player.dispose();
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {
    return (
      <React.Fragment>
        <div data-vjs-player>
          <video ref={(node) => (this.videoNode = node)} className="video-js" />
        </div>
        {/* language=CSS */}
        <style jsx>
          {`
            div[data-vjs-player] {
              width: 100%;
              max-height: 20rem;
            }
          `}
        </style>
      </React.Fragment>
    );
  }
}
