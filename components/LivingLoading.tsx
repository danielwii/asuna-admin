import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import styled from 'styled-components';

const StyledLoading = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  background: whitesmoke;
  bottom: 0;
  z-index: 100;
`;

interface IStyledHeartbeat {
  heartbeat: boolean;
}

const StyledHeartbeat = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 5rem;
  margin: auto;
  width: 20rem;
  display: inline;

  text-align: center;
  padding: 0.5rem;
  color: #fff;
  background-color: ${(props: IStyledHeartbeat) => (props.heartbeat ? '#449d44' : '#c9302c')};
  border-color: ${(props: IStyledHeartbeat) => (props.heartbeat ? '#4cae4c' : '#d43f3a')};
  border-radius: 0.5rem;
  box-shadow: ${(props: IStyledHeartbeat) =>
    props.heartbeat
      ? 'inset 0 0.1rem 0.1rem rgba(0,0,0,.075), 0 0 0.75rem rgba(76, 174, 76, 0.6)'
      : 'inset 0 0.1rem 0.1rem rgba(0,0,0,.075), 0 0 0.75rem rgba(212, 63, 58, 0.6)'};
`;

interface IProps {
  heartbeat: boolean;
}

export default class extends React.Component<IProps> {
  private canvas;

  componentDidMount() {
    const { canvas } = this;
    canvas.width = 200;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    const center = [canvas.width / 2, canvas.height / 2];
    let sequenceNo = 0;

    const step = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.drawLogo(context, (sequenceNo += 1), center);
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  drawLogo(context, sequenceNo, center, speed = 10) {
    _.range(10).forEach(index => {
      context.save();
      context.translate(...center);

      context.shadowColor = 'pink';
      context.shadowBlur = 20;

      const rotateWave = speed * (((sequenceNo / 20) * Math.PI) / 180);
      context.rotate((36 * index * Math.PI) / 180 + rotateWave);
      context.fillStyle = 'rgba(0, 200, 200, 0.25)';

      const widthWave = 10 * Math.cos((sequenceNo * Math.PI) / 540);
      context.fillRect(10, 10, 50 + widthWave, 50 - widthWave);
      context.restore();
    });
  }

  render() {
    const { heartbeat } = this.props;
    return (
      <StyledLoading>
        <StyledHeartbeat heartbeat={heartbeat}>
          {heartbeat ? 'Loading from backend...' : 'Backend server unavailable.'}
        </StyledHeartbeat>
        <canvas
          ref={canvas => {
            this.canvas = canvas;
          }}
        >
          Canvas Not Support?!
        </canvas>
        {/* language=CSS */}
        <style jsx>{`
          canvas {
            /*background: white;*/
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            margin: auto;
          }
        `}</style>
      </StyledLoading>
    );
  }
}
