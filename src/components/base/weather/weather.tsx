import _ from 'lodash';
import * as React from 'react';

const snowCss = () => ({
  animationName: 'snowing',
  animationDuration: `${Math.random() * 3000 + 3000}ms`,
  animationIterationCount: 'infinite',
  animationDelay: `${Math.random() * 2000}ms`,
});

const randomCssCircle = (key: number, color?: string) => {
  const cx = `${Math.random() * 100}%`;
  const cy = -Math.random() * 90 - 10;

  return (
    <circle key={key} style={snowCss()} cx={cx} cy={cy} r={Math.random() * 5} fill={color ?? '#7EE'}>
      {/* language=CSS */}
      <style>{`
        @keyframes snowing {
          from {
            fill-opacity: 1;
          }
          to {
            transform: translateY(16rem);
            fill-opacity: 0;
          }
        }
      `}</style>
    </circle>
  );
};

export const Snow: React.FC<{ color?: string }> = ({ color }) => (
  <svg>
    {_.range(100).map((ele, index) => randomCssCircle(index, color))}
    {/* language=CSS */}
    <style>{`
      svg {
        width: 100%;
        height: 16rem;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
    `}</style>
  </svg>
);
export const Sun = () => (
  <>
    <div className="sun">
      {_.range(8).map((index) => (
        <span key={index} />
      ))}
    </div>
    {/* language=CSS */}
    <style>{`
      .sun {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #000;
        top: 50px;
        right: 50px;
        z-index: 1;
        animation: rotate 10s linear infinite;
      }

      @keyframes rotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(-360deg);
        }
      }

      .sun span {
        position: absolute;
        width: 2px;
        height: 14px;
        background-color: #000;
        top: -18px;
        left: 7px;
        z-index: 1;
        transform-origin: center bottom;
        transform: scaleY(1);
        animation: sun-ray-1 1s linear infinite;
        box-shadow: 4px 4px 0 0 #f1c40f;
      }

      @keyframes sun-ray-1 {
        0%,
        100% {
          transform: scaleY(1);
        }
        50% {
          transform: scaleY(0.6);
        }
      }

      .sun span:nth-child(2) {
        transform: rotate(45deg) scaleY(0.6);
        top: -15px;
        left: 16px;
        animation: sun-ray-2 1s linear infinite;
      }

      @keyframes sun-ray-2 {
        0%,
        100% {
          transform: rotate(45deg) scaleY(0.6);
        }
        50% {
          transform: rotate(45deg) scaleY(1);
        }
      }

      .sun span:nth-child(3) {
        transform: rotate(90deg) scaleY(1);
        top: -5px;
        left: 20px;
        animation: sun-ray-3 1s linear infinite;
      }

      @keyframes sun-ray-3 {
        0%,
        100% {
          transform: rotate(90deg) scaleY(1);
        }
        50% {
          transform: rotate(90deg) scaleY(0.6);
        }
      }

      .sun span:nth-child(4) {
        transform: rotate(135deg) scaleY(0.6);
        top: 3px;
        left: 15px;
        animation: sun-ray-4 1s linear infinite;
      }

      @keyframes sun-ray-4 {
        0%,
        100% {
          transform: rotate(135deg) scaleY(0.6);
        }
        50% {
          transform: rotate(135deg) scaleY(1);
        }
      }

      .sun span:nth-child(5) {
        transform: rotate(180deg) scaleY(1);
        top: 6px;
        left: 7px;
        animation: sun-ray-5 1s linear infinite;
      }

      @keyframes sun-ray-5 {
        0%,
        100% {
          transform: rotate(180deg) scaleY(1);
        }
        50% {
          transform: rotate(180deg) scaleY(0.6);
        }
      }

      .sun span:nth-child(6) {
        transform: rotate(225deg) scaleY(0.6);
        top: 3px;
        left: -2px;
        animation: sun-ray-6 1s linear infinite;
      }

      @keyframes sun-ray-6 {
        0%,
        100% {
          transform: rotate(225deg) scaleY(0.6);
        }
        50% {
          transform: rotate(225deg) scaleY(1);
        }
      }

      .sun span:nth-child(7) {
        transform: rotate(270deg) scaleY(1);
        top: -5px;
        left: -5px;
        animation: sun-ray-7 1s linear infinite;
      }

      @keyframes sun-ray-7 {
        0%,
        100% {
          transform: rotate(270deg) scaleY(1);
        }
        50% {
          transform: rotate(270deg) scaleY(0.6);
        }
      }

      .sun span:nth-child(8) {
        transform: rotate(315deg) scaleY(0.6);
        top: -14px;
        left: -2px;
        animation: sun-ray-8 1s linear infinite;
      }

      @keyframes sun-ray-8 {
        0%,
        100% {
          transform: rotate(315deg) scaleY(0.6);
        }
        50% {
          transform: rotate(315deg) scaleY(1);
        }
      }
    `}</style>
  </>
);
