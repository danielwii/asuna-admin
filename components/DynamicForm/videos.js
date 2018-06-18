/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';
import videojs from 'video.js';
import * as R from 'ramda';

import { Button, Icon, message, Upload } from 'antd';

import { apiProxy } from '../../adapters/api';
import { createLogger } from '../../helpers/logger';

const logger = createLogger('components:dynamic-form:video', 'warn');

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

async function upload(auth, onChange, files, args) {
  logger.log('[upload]', args);
  const response = await apiProxy.upload(auth, args.file);
  logger.log('[upload]', 'response is', response);

  if (/^20\d$/.test(response.status)) {
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

export class VideoUploader extends React.Component {
  static propTypes = {
    auth: PropTypes.shape({}), // auth token object
    host: PropTypes.string.isRequired,
    prefix: PropTypes.string.isRequired,
    value: PropTypes.arrayOf(
      PropTypes.shape({
        bucket: PropTypes.string,
        filename: PropTypes.string,
        mode: PropTypes.string,
        prefix: PropTypes.string,
      }),
    ),
    onChange: PropTypes.func,
    multi: PropTypes.bool,
  };

  state = {
    fileList: [],
  };

  prop = {
    multi: false,
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
    const { auth, onChange, value: videos } = this.props;

    const props = {
      onChange: this.handleChange,
      multiple: false,
      customRequest: (...args) => upload(auth, onChange, [], ...args),
      supportServerRender: true,
      beforeUpload,
    };

    return (
      <div>
        <Upload {...props} fileList={this.state.fileList}>
          <Button>
            <Icon type="upload" /> upload
          </Button>
        </Upload>
        {R.type(videos) === 'Array' && videos.map(this.renderPlayer)}
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // instantiate Video.js
    this.player = videojs(this.videoNode, this.props, () => {
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
      <div data-vjs-player>
        {/* eslint-disable-next-line no-return-assign */}
        <video ref={node => (this.videoNode = node)} className="video-js" />
        {/* language=CSS */}
        <style jsx>{`
          div[data-vjs-player] {
            width: 100%;
            height: 20rem;
          }
        `}</style>
      </div>
    );
  }
}
