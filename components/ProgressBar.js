import React from 'react';

import { Progress } from 'antd';

import styled, { keyframes } from 'styled-components';
import { fadeIn, fadeOut }   from 'react-animations';

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
    counter: 0,
  };

  componentDidMount() {
    const { XMLHttpRequest } = window;
    window.XMLHttpRequest    = () => {
      this.setState({ counter: this.state.counter += 1, percentComplete: 0 });
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          const percentComplete = (evt.loaded / evt.total) * 100;
          this.setState({ percentComplete });
        }
      }, false);
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
          this.setState({ counter: this.state.counter -= 1 });
        }
      }, false);
      return xhr;
    };
  }

  render() {
    const { counter, percentComplete } = this.state;

    const percent = counter ? (1 / counter) * 100 : 100;
    const hidden  = percent === 100 && percentComplete === 100;

    return (
      <FadeDiv out={hidden}>
        <Progress
          strokeWidth={2}
          percent={percent}
          successPercent={percentComplete}
          status="active"
          showInfo={false}
        />
      </FadeDiv>
    );
  }
}
