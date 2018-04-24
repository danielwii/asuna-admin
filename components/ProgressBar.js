import React from 'react';

import { Progress } from 'antd';

import styled, { keyframes } from 'styled-components';
import { fadeIn, fadeOut }   from 'react-animations';

import { createLogger, lv } from '../helpers/logger';

const logger = createLogger('components:progress-bar', lv.warn);

/**
 * transition 提前一点结束用来移除时间一样时最后出现的抖动
 */
const FadeDiv = styled.div`
  visibility: ${({ out }) => (out ? 'hidden' : 'visiable')}
  transition: visibility 1.5s;
  animation: 2s ${({ out }) => (out ? keyframes`${fadeOut}` : keyframes`${fadeIn}`)};
  width: 100%;
  position: fixed;
  top: -0.6rem;
`;

export default class extends React.Component {
  state = {
    counter : 0,
    complete: 100,
  };

  componentDidMount() {
    const { XMLHttpRequest } = window;
    window.XMLHttpRequest    = () => {
      this.setState({ counter: this.state.counter + 1, complete: 0 });
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          const complete = (evt.loaded / evt.total) * 100;
          this.setState({ complete });
        }
      }, false);
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
          this.setState({ counter: this.state.counter - 1 });
        }
      }, false);
      xhr.addEventListener('error', () => {
        // logger.warn('error', { e });
        this.setState({ counter: this.state.counter - 1 });
      });
      xhr.addEventListener('abort', () => {
        // logger.warn('abort', { e });
        this.setState({ counter: this.state.counter - 1 });
      });
      return xhr;
    };
  }

  render() {
    const { counter, complete } = this.state;

    const percent = counter ? (1 / counter) * 100 : 100;
    const hidden  = percent === 100 && complete === 100;

    logger.log('[render]', { counter, percent, complete, hidden });

    return (
      <FadeDiv out={hidden}>
        <Progress
          strokeWidth={2}
          percent={percent}
          successPercent={complete}
          status="active"
          showInfo={false}
        />
      </FadeDiv>
    );
  }
}
