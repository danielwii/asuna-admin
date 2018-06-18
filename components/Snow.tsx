import React from 'react';

const snowCss = () => ({
  animationName: 'snowing',
  animationDuration: `${Math.random() * 3000 + 3000}ms`,
  animationIterationCount: 'infinite',
  animationDelay: `${Math.random() * 2000}ms`,
});

const randomCssCircle = key => {
  const cx = `${Math.random() * 100}%`;
  const cy = -Math.random() * 90 - 10;

  return (
    <circle key={key} style={snowCss()} cx={cx} cy={cy} r={Math.random() * 5} fill="#7EE">
      {/* language=CSS */}
      <style jsx global>
        {`
          @keyframes snowing {
            from {
              fill-opacity: 1;
            }
            to {
              transform: translateY(16rem);
              fill-opacity: 0;
            }
          }
        `}
      </style>
    </circle>
  );
};

export default () => (
  <svg className="svg-snow">
    {[...Array(100).keys()].map((ele, index) => randomCssCircle(index))}
    {/* language=CSS */}
    <style jsx>
      {`
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
      `}
    </style>
  </svg>
);
