import { Icon, notification, Timeline } from 'antd';
import _ from 'lodash';
import nanoid from 'nanoid';
import { differenceInSeconds } from 'date-fns';
import * as React from 'react';

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
      <Timeline>
        {TimelineMessageBox.messages.map(message =>
          message.type !== 'loading' ? (
            <Timeline.Item key={message.key} color={message.type === 'done' ? 'green' : 'red'}>
              <p>{message.content}</p>
            </Timeline.Item>
          ) : (
            <Timeline.Item key={message.key} dot={<Icon type="loading" style={{ fontSize: '16px' }} />}>
              <p>{message.content}</p>
            </Timeline.Item>
          ),
        )}
      </Timeline>
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
    MessageBox.show({ key: this.boxId, message: this.render() });
    return _key;
  }
}
