import React   from 'react';
import * as R  from 'ramda';
import videojs from 'video.js';

import { Button, Icon, message, Upload } from 'antd';

import { apiProxy }     from '../../adapters/api';
import { createLogger } from '../../adapters/logger';

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
    message.error('Image must smaller than 100MB!');
  }
  return isMP4 && isLt100M;
}

async function upload(auth, onChange, files, args) {
  logger.log('[upload]', args);
  const response = await apiProxy.upload(auth, args.file);
  logger.log('[upload]', 'response is', response);

  if (response.status === 200) {
    message.success('upload successfully.');
    args.onSuccess();

    const urls = R.compose(
      R.join(','),
      R.filter(R.identity),
      R.concat(files),
    )(response.data);
    logger.log('[upload]', urls);

    onChange(urls);
  } else {
    message.error('upload failed.');
    args.onError();
  }
}

// --------------------------------------------------------------
// Uploader
// --------------------------------------------------------------

// eslint-disable-next-line import/prefer-default-export
export class VideoUploader extends React.Component {
  state = {
    fileList: [],
    // fileList: [{
    //   uid   : -1,
    //   name  : 'xxx.png',
    //   status: 'done',
    //   url   : 'http://www.baidu.com/xxx.png',
    // }],
  };

  handleChange = (info) => {
    let fileList = info.fileList;

    // 1. Limit the number of uploaded files
    //    Only to show two recent uploaded files, and old ones will be replaced by the new
    fileList = fileList.slice(-1);

    // 2. read from response and show file link
    fileList = fileList.map((file) => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
      }
      return file;
    });

    // 3. filter successfully uploaded files according to response from server
    fileList = fileList.filter((file) => {
      if (file.response) {
        return file.response.status === 'success';
      }
      return true;
    });

    this.setState({ fileList });
  };

  render() {
    const { auth, onChange, value: videoUrl } = this.props;

    const props = {
      // action  : '//jsonplaceholder.typicode.com/posts/',
      onChange     : this.handleChange,
      multiple     : false,
      customRequest: (...args) => upload(auth, onChange, [], ...args),
      beforeUpload,
    };

    const videoJsOptions = {
      width   : 640,
      height  : 264,
      autoplay: true,
      controls: true,
      sources : [{
        src : videoUrl,
        type: 'video/mp4',
      }],
    };

    return (
      <div>
        <Upload {...props} fileList={this.state.fileList}>
          <Button>
            <Icon type="upload" /> upload
          </Button>
        </Upload>
        {!videoUrl ? null : <VideoPlayer {...videoJsOptions} />}
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // instantiate Video.js
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log('onPlayerReady', this);
    });
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {
    return (
      <div data-vjs-player>
        <video ref={node => this.videoNode = node} className="video-js" />
      </div>
    );
  }
}
