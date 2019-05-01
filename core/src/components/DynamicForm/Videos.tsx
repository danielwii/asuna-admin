import React from 'react';
import videojs from 'video.js';
import * as R from 'ramda';
import _ from 'lodash';

import { Button, Icon, message, Upload } from 'antd';

import { createLogger } from '@asuna-admin/logger';
import { apiProxy } from '@asuna-admin/adapters';

const logger = createLogger('components:dynamic-form:video');

// --------------------------------------------------------------
// Function
// --------------------------------------------------------------

function beforeUpload(file) {
  logger.log('[beforeUpload]', 'file is', file);
  const isMP4 = file.type === 'video/mp4';
  if (!isMP4) {
    message.error('You can only upload MP4 file!');
  }
  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    message.error('Video must smaller than 100MB!');
  }
  return isMP4 && isLt100M;
}

async function upload(onChange, files, args?) {
  logger.log('[upload]', args);
  const response = await apiProxy.upload(args.file);
  logger.log('[upload]', 'response is', response);

  if (/^20\d$/.test(response.status as any)) {
    message.success('upload successfully.');
    args.onSuccess();

    onChange(response.data);
  } else {
    message.error('upload failed.');
    args.onError();
  }
}

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

export interface IProps {
  host?: string;
  prefix?: string;
  value?: string;
  multi?: boolean;
  onChange?: (value: any) => void;
  urlHandler?: (value: any) => void;
}

export class VideoUploader extends React.Component<IProps> {
  prop = {
    multi: false,
  };

  state = {
    fileList: [],
  };

  handleChange = info => {
    const { multi } = this.props;

    let { fileList } = info;

    // 1. Limit the number of uploaded files
    //    this old ones will be replaced by the new

    if (multi) {
      fileList = fileList.slice(-3);
    } else {
      fileList = fileList.slice(-1);
    }

    // 2. read from response and show file link
    fileList = fileList.map(file => {
      if (file.response) {
        // Component will show file.url as link
        return { ...file, url: file.response.url };
      }
      return file;
    });

    // 3. filter successfully uploaded files according to response from server
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.status === 'success';
      }
      return true;
    });

    this.setState({ fileList });
  };

  renderPlayer = video => {
    logger.debug('[VideoUploader][renderPlayer]', video);

    const { host, prefix } = this.props;

    if (video) {
      const videoJsOptions = {
        // width   : '100%',
        // height  : 320,
        autoplay: false,
        controls: true,
        sources: [
          {
            src: `${host}/${prefix}/${video.prefix}/${video.filename}`,
            type: 'video/mp4',
          },
        ],
      };
      return <VideoPlayer key={video.filename} {...videoJsOptions} />;
    }
    return null;
  };

  render() {
    const { onChange, value: videos } = this.props;
    const { fileList } = this.state;

    const props = {
      onChange: this.handleChange,
      multiple: false,
      customRequest: (...args) => upload(onChange, [], ...args),
      supportServerRender: true,
      beforeUpload,
    };

    return (
      <div>
        <Upload {...props} fileList={fileList}>
          <Button>
            <Icon type="upload" /> upload
          </Button>
        </Upload>
        {R.type(videos) === 'Array' && _.map(videos || [], this.renderPlayer)}
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
          <video ref={node => (this.videoNode = node)} className="video-js" />
        </div>
        {/* language=CSS */}
        <style jsx>
          {`
            div[data-vjs-player] {
              width: 100%;
              height: 20rem;
            }
          `}
        </style>
      </React.Fragment>
    );
  }
}
