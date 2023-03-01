import { LoadingOutlined } from '@ant-design/icons';

import { Timeline, notification } from 'antd';
import { differenceInSeconds } from 'date-fns';
import * as _ from 'lodash';
import { nanoid } from 'nanoid';
import * as React from 'react';
import * as util from 'util';

import { isDevMode } from '../core/env';

export type MessageBoxType = 'open' | 'success' | 'error' | 'info' | 'warning' | 'warn';

export class MessageBox {
  static show({ type, key, message }: { type?: MessageBoxType; key?: string; message: React.ReactNode }): string {
    const id = key || nanoid();
    notification[type || 'open']({
      key: id,
      message: null,
      description: message,
      placement: 'bottomRight',
      duration: 2,
    });
    return id;
  }
}

export class TimelineMessageBox {
  private static boxId = nanoid();
  private static messages: {
    key: string;
    type: 'loading' | 'done' | 'error';
    content: React.ReactNode;
    createdAt: number;
  }[] = [];

  private static render = () => {
    return (
      <Timeline
        items={TimelineMessageBox.messages.map((message) =>
          message.type !== 'loading'
            ? {
                color: message.type === 'done' ? 'green' : 'red',
                children: _.isObject(message.content) ? <pre>{util.inspect(message.content)}</pre> : message.content,
              }
            : {
                dot: <LoadingOutlined style={{ fontSize: '16px' }} />,
                children: _.isObject(message.content) ? <pre>{util.inspect(message.content)}</pre> : message.content,
              },
        )}
      />
    );
  };

  static push({
    type,
    key,
    message,
  }: {
    type?: 'loading' | 'done' | 'error';
    key?: string;
    message: React.ReactNode;
  }): string {
    const _type = type || 'done';
    const _key = key || nanoid();

    const createdAt = Date.now();
    const found = key ? _.find(this.messages, { key: _key }) : null;
    if (found) {
      found.type = _type;
      found.content = message;
      found.createdAt = createdAt;
    } else {
      this.messages.push({ key: _key, type: _type, content: message, createdAt });
    }
    _.remove(this.messages, ({ createdAt }) => !createdAt || differenceInSeconds(Date.now(), createdAt) > 3);
    if (isDevMode) MessageBox.show({ key: this.boxId, message: this.render() });
    return _key;
  }
}
