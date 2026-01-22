import {
  Card as AntdCard,
  CardProps,
  Flex,
  List,
  Space,
  Tag,
  Typography,
} from 'antd';
import { BookFilled } from '@ant-design/icons';
import { Card } from '../../../index.ts';
import { createElement } from 'react';
import CountUp from 'react-countup';

const SOCIALS_DATA = [
  {
    title: 'Tổng số hoá đơn',
    diff: 12.3,
    value: 216869,
  },
  {
    title: 'Đã chi trả',
    diff: 4.8,
    value: 978342,
  },
  {
    title: 'Chưa chi trả',
    diff: -2.4,
    value: 567323,
  },
  {
    title: 'Hoá đơn quá hạn',
    diff: -2.4,
    value: 567323,
  },
  {
    title: 'Hoá đơn huỷ thanh toán',
    diff: -2.4,
    value: 567323,
  },
  {
    title: 'Trả thừa',
    diff: -2.4,
    value: 567323,
  },
];

type Props = CardProps;

export const SocialStatsCard = ({ ...others }: Props) => (
  <Card title="Dữ liệu hóa đơn" {...others}>
    <List
      grid={{
        gutter: 16,
        xs: 1,
        sm: 1,
        md: 2,
        lg: 2,
        xl: 2,
        xxl: 2,
      }}
      dataSource={SOCIALS_DATA}
      renderItem={(item, i) => (
        <List.Item>
          <AntdCard key={`${item.title}-${i}`} hoverable={false}>
            <Flex vertical gap="middle" justify="center">
              <Flex align="center" justify="space-between">
                <Space>
                  {createElement(BookFilled)}
                  <Typography.Text className="text-capitalize">
                    {item.title}
                  </Typography.Text>
                </Space>
                <Tag color={item.diff < 0 ? 'red-inverse' : 'green-inverse'}>
                  {item.diff}%
                </Tag>
              </Flex>
              <Flex gap="small" align="flex-end">
                <Typography.Title level={3} className="m-0">
                  <CountUp end={item.value} />
                </Typography.Title>
                <Typography.Text color="secondary">hoá đơn</Typography.Text>
              </Flex>
            </Flex>
          </AntdCard>
        </List.Item>
      )}
    />
  </Card>
);
