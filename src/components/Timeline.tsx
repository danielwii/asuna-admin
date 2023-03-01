import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

import useLogger from '@danielwii/asuna-helper/dist/logger/hooks';

import { Badge, Col, Row, Statistic, Tag, Timeline } from 'antd';
import moment from 'moment';
import { default as React, useState } from 'react';
import * as util from 'util';

export interface ExchangeItem {
  id: string | number;
  change: number;
  before: number;
  after: number;
  type: string;
  remark?: string;
  extra?: JSON;
}

export const ActivityTimeline: React.FC<{
  item;
  typeResolver?: (type: string) => string;
  typeColorResolver?: (type: string) => string | undefined;
  extraResolver?: (extra: any) => React.ReactNode;
}> = ({ item, typeResolver, typeColorResolver, extraResolver }) => {
  // useLogger('<[ActivityTimeline]>', { item, typeResolver, typeColorResolver, extraResolver });
  return (
    <div>
      <Tag>{typeResolver ? typeResolver(item.operation) : item.operation}</Tag>
      From <Tag>{item.from}</Tag> To <Tag>{item.to}</Tag>
      {item.reason && <div>Reason: {item.reason}</div>}
    </div>
  );
};

export function ExchangeTimeline({
  item,
  typeResolver,
  typeColorResolver,
  extraResolver,
}: {
  item: ExchangeItem;
  typeResolver?: (type: string) => string;
  typeColorResolver?: (type: string) => string | undefined;
  extraResolver?: (extra: any) => React.ReactNode;
}) {
  const [state, setState] = useState({});

  return (
    <Timeline.Item key={item.id} color={item.change > 0 ? 'green' : 'red'}>
      <div>
        <Tag>{typeResolver ? typeResolver(item.type) : item.type}</Tag>{' '}
        <Badge
          count={+item.change}
          overflowCount={Number.MAX_SAFE_INTEGER}
          style={item.change > 0 ? { backgroundColor: '#52c41a' } : {}}
        />{' '}
        at {moment(item['createdAt']).calendar()}
      </div>
      {item.remark && <div>Reason: {item.remark}</div>}
      <Row>
        {item.change > 0 ? (
          <>
            <Col span={6}>
              <Statistic title="+" value={item.change} valueStyle={{ color: '#3f8600' }} prefix={<ArrowUpOutlined />} />
            </Col>
            <Col>
              <Statistic
                title="total"
                value={item.after}
                valueStyle={typeColorResolver ? { color: typeColorResolver(item.type) } : undefined}
              />
            </Col>
          </>
        ) : (
          <>
            <Col span={6}>
              <Statistic
                title="-"
                value={item.change}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
              />
            </Col>
            <Col>
              <Statistic
                title="total"
                value={item.after}
                valueStyle={typeColorResolver ? { color: typeColorResolver(item.type) } : undefined}
              />
            </Col>
          </>
        )}
        {item.extra ? (
          <Col>{extraResolver ? extraResolver(item.extra) : <pre>{util.inspect(item.extra)}</pre>}</Col>
        ) : null}
      </Row>
    </Timeline.Item>
  );
}
