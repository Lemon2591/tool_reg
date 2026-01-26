import { Button, CardProps } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Area } from '@ant-design/charts';
import { Card } from '../../../index.ts';

const AreaChart = () => {
  const data = [
    {
      timePeriod: 'Tháng 7',
      value: 100,
    },
    {
      timePeriod: 'Tháng 8',
      value: 150,
    },
    {
      timePeriod: 'Tháng 9',
      value: 50,
    },
    {
      timePeriod: 'Tháng 10',
      value: 20,
    },
    {
      timePeriod: 'Tháng 11',
      value: 100,
    },
  ];

  const config = {
    data,
    xField: 'timePeriod',
    yField: 'value',
    xAxis: {
      range: [0, 1],
    },
    smooth: true,
    height: 400,
  };

  return <Area {...config} />;
};

type Props = CardProps;

export const VisitorsChartCard = ({ ...others }: Props) => {
  return (
    <Card title="Thống kê dữ chạy theo tháng" {...others}>
      <AreaChart />
    </Card>
  );
};
