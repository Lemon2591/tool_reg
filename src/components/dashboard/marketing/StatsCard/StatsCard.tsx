import { CardProps, Col, Flex, Row, Tag, Typography } from 'antd';
import { TinyColumn } from '@ant-design/charts';
import { Card } from '../../../index.ts';
import CountUp from 'react-countup';

type ChartData = [number, number, number, number];

type StatsColumnChartProps = {
  data: ChartData;
  color?: string;
};

const ColumnChart = ({ data, color }: StatsColumnChartProps) => {
  const brandColor = color || '#5B8FF9';
  const config = {
    height: 64,
    autoFit: true,
    data,
    color: brandColor,
    tooltip: {
      customContent: function (x: any, data: any) {
        return `NO.${x}: ${data[0]?.data?.y.toFixed(2)}`;
      },
    },
  };
  return <TinyColumn {...config} />;
};

type Props = {
  title?: string;
  value?: number | string;
  data?: ChartData;
  diff?: number;
  asCurrency?: boolean;
  typePage?: string;
} & CardProps;

export const StatsCard = ({
  data,
  diff,
  title,
  value,
  asCurrency,
  typePage = '',
  ...others
}: Props) => {
  return (
    <Card {...others}>
      <Flex vertical>
        <Typography.Text className="m-0">{title}</Typography.Text>
        <Row>
          <Col span={data ? 14 : undefined}>
            <Typography.Title level={2}>
              {typeof value === 'number' ? (
                <>
                  <CountUp end={value} />
                  {asCurrency && <span>&nbsp;VND</span>}
                </>
              ) : (
                value
              )}
            </Typography.Title>
          </Col>
          {data && (
            <Col span={10}>
              <ColumnChart data={data} />
            </Col>
          )}
        </Row>
        <Flex align="center">
          <Tag color={'green'}>
            {typePage === 'view'
              ? 'Lượt xem'
              : typePage === 'stories'
                ? 'Truyện'
                : typePage === 'category'
                  ? 'Thể loại'
                  : 'Đang phát triển'}
          </Tag>
        </Flex>
      </Flex>
    </Card>
  );
};
