import React from 'react';

import { Progress } from 'antd';

import styled, { keyframes } from 'styled-components';
import { fadeIn, fadeOut } from 'react-animations';

import { createLogger, lv } from '../helpers/logger';

const logger = createLogger('components:progress-bar', lv.warn);

/**
 * transition 提前一点结束用来移除时间一样时最后出现的抖动
 */
const FadeDiv = styled.div`
  visibility: ${(props: { out }) => (props.out ? 'hidden' : 'visiable')};
  transition: visibility 0.5s;
  animation: 2s ${(props: { out }) => (props.out ? keyframes`${fadeOut}` : keyframes`${fadeIn}`)};
  width: 100%;
  position: fixed;
  top: -0.6rem;
`;

export default class extends React.Component {
  state = {
    counter: 0,
    complete: 100,
  };

  componentDidMount() {
    const { XMLHttpRequest } = window as any;
    const isNotWs = xhr => !xhr.responseURL.includes('/socket.io/');

    (window as any).XMLHttpRequest = () => {
      this.setState({ counter: this.state.counter + 1, complete: 0 });
      const xhr = new XMLHttpRequest();

      xhr.addEventListener(
        'progress',
        evt => {
          const notWs = isNotWs(xhr);
          // console.log('[xhr]', 'progress', { notWs, xhr, evt });
          if (notWs) {
            if (evt.lengthComputable) {
              const complete = evt.loaded / evt.total * 100;
              this.setState({ complete });
            }
          } else {
            this.setState({ counter: this.state.counter - 1 });
          }
        },
        false,
      );
      xhr.addEventListener('loadend', () => {
        const notWs = isNotWs(xhr);
        // console.log('[xhr]', 'loadend', { notWs, xhr, evt });
        if (notWs) {
          this.setState({ counter: this.state.counter - 1 });
        }
      });
      return xhr;
    };
  }

  render() {
    const { counter, complete } = this.state;

    const percent = counter ? 1 / counter * 100 : 100;
    const hidden = percent === 100 && complete === 100;

    logger.log('[render]', { counter, percent, complete, hidden });

    return (
      <FadeDiv out={hidden}>
        <Progress
          strokeWidth={2}
          // percent={percent}
          successPercent={complete}
          status="active"
          showInfo={false}
        />
      </FadeDiv>
    );
  }
}
