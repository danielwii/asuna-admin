import { Badge, Icon, Statistic, Tag, Timeline } from 'antd';
import moment from 'moment';
import { default as React, useState } from 'react';

export interface ExchangeItem {
  id: string | number;
  change: number;
  before: number;
  after: number;
  type: string;
  remark?: string;
}

export function ExchangeTimeline({ item }: { item: ExchangeItem }) {
  const [state, setState] = useState({});

  return (
    <Timeline.Item key={item.id} color={item.change > 0 ? 'green' : 'red'}>
      <p>
        <Badge
          count={+item.change}
          overflowCount={Number.MAX_SAFE_INTEGER}
          style={item.change > 0 ? { backgroundColor: '#52c41a' } : {}}
        />{' '}
        <Tag>{item.type}</Tag> at {moment(item['createdAt']).calendar()}
      </p>
      {item.remark && <p>Reason: {item.remark}</p>}
      <p>
        {item.change > 0 ? (
          <Statistic
            value={item.after}
            valueStyle={{ color: '#3f8600' }}
            prefix={<Icon type="arrow-up" />}
          />
        ) : (
          <Statistic
            value={item.after}
            valueStyle={{ color: '#cf1322' }}
            prefix={<Icon type="arrow-down" />}
          />
        )}
      </p>
    </Timeline.Item>
  );
}
