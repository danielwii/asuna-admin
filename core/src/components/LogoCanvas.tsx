import _ from 'lodash';
import React from 'react';

export class LogoCanvas extends React.Component {
  private canvas;

  componentDidMount() {
    const canvas = this.canvas;
    canvas.width = 160;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    let sequenceNo = 0;

    const step = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.drawLogo(context, (sequenceNo += 1));
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  drawLogo(context, sequenceNo) {
    _.range(10).forEach(index => {
      context.save();
      context.translate(80, 80);

      context.shadowColor = 'pink';
      context.shadowBlur = 20;

      const rotateWave = ((sequenceNo / 4) * Math.PI) / 180;
      context.rotate((36 * index * Math.PI) / 180 + rotateWave);
      context.fillStyle = 'rgba(0, 200, 200, 0.25)';

      const widthWave = 10 * Math.cos((sequenceNo * Math.PI) / 540);
      context.fillRect(0, 0, 50 + widthWave, 50 - widthWave);
      context.restore();
    });
  }

  render() {
    return <canvas ref={canvas => (this.canvas = canvas)}>Canvas Not Support?!</canvas>;
  }
}
