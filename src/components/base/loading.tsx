import _ from 'lodash';
import React from 'react';

export type LoadingType =
  | 'plane'
  | 'chase'
  | 'wander'
  | 'fold'
  | 'grid'
  | 'circle-fade'
  | 'circle'
  | 'swing'
  | 'flow'
  | 'pulse'
  | 'wave'
  | 'bounce';

export const Loading: React.FC<{ type: LoadingType }> = React.memo(({ type }) => {
  switch (type) {
    case 'wander':
      return (
        <div className="sk-wander">
          {_.range(3).map((item) => {
            return <div key={item} className="sk-wander-cube" />;
          })}
        </div>
      );
    case 'fold':
      return (
        <div className="sk-fold">
          {_.range(4).map((item) => {
            return <div key={item} className="sk-fold-cube" />;
          })}
        </div>
      );
    case 'grid':
      return (
        <div className="sk-grid">
          {_.range(9).map((item) => {
            return <div key={item} className="sk-grid-cube" />;
          })}
        </div>
      );
    case 'circle-fade':
      return (
        <div className="sk-circle-fade">
          {_.range(12).map((item) => {
            return <div key={item} className="sk-circle-fade-dot" />;
          })}
        </div>
      );
    case 'circle':
      return (
        <div className="sk-circle">
          {_.range(12).map((item) => {
            return <div key={item} className="sk-circle-dot" />;
          })}
        </div>
      );
    case 'swing':
      return (
        <div className="sk-swing">
          {_.range(2).map((item) => {
            return <div key={item} className="sk-swing-dot" />;
          })}
        </div>
      );
    case 'flow':
      return (
        <div className="sk-flow">
          {_.range(3).map((item) => {
            return <div key={item} className="sk-flow-dot" />;
          })}
        </div>
      );
    case 'pulse':
      return <div className="sk-pulse" />;
    case 'wave':
      return (
        <div className="sk-wave">
          {_.range(5).map((item) => {
            return <div key={item} className="sk-wave-rect" />;
          })}
        </div>
      );
    case 'bounce':
      return (
        <div className="sk-bounce">
          {_.range(2).map((item) => {
            return <div key={item} className="sk-bounce-dot" />;
          })}
        </div>
      );
    case 'chase':
      return (
        <div className="sk-chase">
          {_.range(6).map((item) => {
            return <div key={item} className="sk-chase-dot" />;
          })}
        </div>
      );
    case 'plane':
    default:
      return <div className="sk-plane" />;
  }
});
