/* eslint-disable no-undef,no-param-reassign */
import React from 'react';
import _     from 'lodash';

export default class extends React.Component {
  componentDidMount() {
    const { canvas } = this;
    canvas.width     = 200;
    canvas.height    = 200;
    const context    = canvas.getContext('2d');
    const center     = [canvas.width / 2, canvas.height / 2];
    let sequenceNo   = 0;

    const step = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.drawLogo(context, sequenceNo += 1, center);
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  drawLogo(context, sequenceNo, center, speed = 10) {
    _.range(10).forEach((index) => {
      context.save();
      context.translate(...center);

      context.shadowColor = 'pink';
      context.shadowBlur  = 20;

      const rotateWave = speed * (((sequenceNo / 20) * Math.PI) / 180);
      context.rotate(((36 * index * Math.PI) / 180) + rotateWave);
      context.fillStyle = 'rgba(0, 200, 200, 0.25)';

      const widthWave = 10 * Math.cos((sequenceNo * Math.PI) / 540);
      context.fillRect(10, 10, 50 + widthWave, 50 - widthWave);
      context.restore();
    });
  }

  render() {
    return (
      <React.Fragment>
        <canvas ref={(canvas) => { this.canvas = canvas; }}>Canvas Not Support?!</canvas>
        {/* language=CSS */}
        <style jsx>{`
        canvas {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          margin: auto;
        }
        `}</style>
      </React.Fragment>
    );
  }
}
