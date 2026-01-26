import {
  Alert,
  Button,
  ButtonProps,
  Col,
  Flex,
  Image,
  Popover,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  TagProps,
  Typography,
} from 'antd';
import {
  Card,
  CustomerReviewsCard,
  DeliveryTableCard,
  PageHeader,
  RevenueCard,
  UserAvatar,
} from '../../components';
import { Area, Bullet, Pie } from '@ant-design/charts';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  PieChartOutlined,
  QuestionOutlined,
  StarFilled,
  SyncOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import { createElement, CSSProperties, useEffect, useState } from 'react';
import { useFetchData } from '../../hooks';
import { blue, green, red, yellow } from '@ant-design/colors';
import CountUp from 'react-countup';
import { numberWithCommas } from '../../utils';
import { ReceiptModal } from '../../components/dashboard/ecommerce';

const { Text, Title } = Typography;

const SalesChart = () => {
  const data = [
    {
      country: 'Online Store',
      date: 'Jan',
      value: 1390.5,
    },
    {
      country: 'Online Store',
      date: 'Feb',
      value: 1469.5,
    },
    {
      country: 'Online Store',
      date: 'Mar',
      value: 1521.7,
    },
    {
      country: 'Online Store',
      date: 'Apr',
      value: 1615.9,
    },
    {
      country: 'Online Store',
      date: 'May',
      value: 1703.7,
    },
    {
      country: 'Online Store',
      date: 'Jun',
      value: 1767.8,
    },
    {
      country: 'Online Store',
      date: 'Jul',
      value: 1806.2,
    },
    {
      country: 'Online Store',
      date: 'Aug',
      value: 1903.5,
    },
    {
      country: 'Online Store',
      date: 'Sept',
      value: 1986.6,
    },
    {
      country: 'Online Store',
      date: 'Oct',
      value: 1952,
    },
    {
      country: 'Online Store',
      date: 'Nov',
      value: 1910.4,
    },
    {
      country: 'Online Store',
      date: 'Dec',
      value: 2015.8,
    },
    {
      country: 'Facebook',
      date: 'Jan',
      value: 109.2,
    },
    {
      country: 'Facebook',
      date: 'Feb',
      value: 115.7,
    },
    {
      country: 'Facebook',
      date: 'Mar',
      value: 120.5,
    },
    {
      country: 'Facebook',
      date: 'Apr',
      value: 128,
    },
    {
      country: 'Facebook',
      date: 'May',
      value: 134.4,
    },
    {
      country: 'Facebook',
      date: 'Jun',
      value: 142.2,
    },
    {
      country: 'Facebook',
      date: 'Jul',
      value: 157.5,
    },
    {
      country: 'Facebook',
      date: 'Aug',
      value: 169.5,
    },
    {
      country: 'Facebook',
      date: 'Sept',
      value: 186.3,
    },
    {
      country: 'Facebook',
      date: 'Oct',
      value: 195.5,
    },
    {
      country: 'Facebook',
      date: 'Nov',
      value: 198,
    },
    {
      country: 'Facebook',
      date: 'Dec',
      value: 211.7,
    },
  ];

  const config = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'country',
    slider: {
      start: 0.1,
      end: 0.9,
    },
  };

  return <Area {...config} />;
};

const CategoriesChart = () => {
  const data = [
    {
      type: 'Dưới 1 phút',
      value: 20,
    },
    {
      type: 'Trên 3 phút',
      value: 20,
    },
    {
      type: 'Trên 5 phút',
      value: 20,
    },
    {
      type: 'Trên 10 phút',
      value: 20,
    },
    {
      type: 'Trên 15 phút',
      value: 20,
    },
  ];

  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    innerRadius: 0.5,
    height: 200,
    label: {
      type: 'inner',
      offset: '-50%',
      content: '{value}%',
      style: {
        textAlign: 'center',
        fontSize: 12,
      },
    },
    tooltip: false,
    interactions: [
      {
        type: 'element-selected',
      },
      {
        type: 'element-active',
      },
    ],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 16,
        },
        content: 'Thời gian xem',
      },
    },
  };

  // @ts-ignore
  return <Pie {...config} />;
};

const CustomerRateChart = () => {
  const data = [
    {
      title: '',
      ranges: [100],
      measures: [50, 50],
      target: 100,
    },
  ];
  const config = {
    data,
    measureField: 'measures',
    rangeField: 'ranges',
    targetField: 'target',
    xField: 'title',
    color: {
      range: ['#FFbcb8', '#FFe0b0', '#bfeec8'],
      measure: ['#5B8FF9', '#61DDAA'],
      target: '#39a3f4',
    },
    label: {
      measure: {
        position: 'middle',
        style: {
          fill: '#fff',
        },
      },
    },
    xAxis: {
      line: null,
    },
    yAxis: false,
    tooltip: false,
    // customize legend
    legend: {
      custom: true,
      position: 'bottom',
      items: [
        {
          value: 'NewReceipt',
          name: 'Đơn mới',
          marker: {
            symbol: 'square',
            style: {
              fill: '#5B8FF9',
              r: 5,
            },
          },
        },
        {
          value: 'Returning',
          name: 'Đơn khác hàng cũ',
          marker: {
            symbol: 'square',
            style: {
              fill: '#61DDAA',
              r: 5,
            },
          },
        },
      ],
    },
  };
  // @ts-ignore
  return <Bullet {...config} />;
};

const SELLER_COLUMNS = [
  {
    title: 'Name',
    dataIndex: 'first_name',
    key: 'first_name',
    render: (_: any, { first_name, last_name }: any) => (
      <UserAvatar fullName={`${first_name} ${last_name}`} />
    ),
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    render: (_: any) => <Link to={`mailto:${_}`}>{_}</Link>,
  },
  {
    title: 'Region',
    dataIndex: 'sales_region',
    key: 'sales_region',
  },
  {
    title: 'Country',
    dataIndex: 'country',
    key: 'country',
  },
  {
    title: 'Volume',
    dataIndex: 'sales_volume',
    key: 'sales_volume',
    render: (_: any) => <span>{numberWithCommas(Number(_))}</span>,
  },
  {
    title: 'Amount',
    dataIndex: 'total_sales',
    key: 'total_sales',
    render: (_: any) => <span>${numberWithCommas(Number(_))}</span>,
  },
  {
    title: 'Satisfaction rate',
    dataIndex: 'customer_satisfaction',
    key: 'customer_satisfaction',
    render: (_: any) => {
      let color;

      if (_ < 20) {
        color = red[5];
      } else if (_ > 21 && _ < 50) {
        color = yellow[6];
      } else if (_ > 51 && _ < 70) {
        color = blue[5];
      } else {
        color = green[6];
      }

      return <Progress percent={_} strokeColor={color} />;
    },
  },
];

const ORDERS_COLUMNS = [
  {
    title: 'Tracking No.',
    dataIndex: 'tracking_number',
    key: 'tracking_number',
  },
  {
    title: 'Customer',
    dataIndex: 'customer_name',
    key: 'customer_name',
    render: (_: any) => <UserAvatar fullName={_} />,
  },
  {
    title: 'Date',
    dataIndex: 'order_date',
    key: 'order_date',
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (_: any) => <span>$ {_}</span>,
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_: any) => {
      let color: TagProps['color'], icon: any;

      if (_ === 'shipped') {
        color = 'magenta-inverse';
        icon = ClockCircleOutlined;
      } else if (_ === 'processing') {
        color = 'blue-inverse';
        icon = SyncOutlined;
      } else if (_ === 'delivered') {
        color = 'green-inverse';
        icon = CheckCircleOutlined;
      } else {
        color = 'volcano-inverse';
        icon = ExclamationCircleOutlined;
      }

      return (
        <Tag
          className="text-capitalize"
          color={color}
          icon={createElement(icon)}
        >
          {_}
        </Tag>
      );
    },
  },
  {
    title: 'Country',
    dataIndex: 'country',
    key: 'country',
  },
  {
    title: 'Address',
    dataIndex: 'shipping_address',
    key: 'shipping_address',
  },
];

const cardStyles: CSSProperties = {
  height: '100%',
};

export const EcommerceDashboardPage = () => {
  const stylesContext = useStylesContext();
  const {
    data: trucksDeliveryData,
    loading: trucksDeliveryDataLoading,
    error: trucksDeliveryDataError,
  } = useFetchData('../mocks/TruckDeliveries.json');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div>
      <ReceiptModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        title={'Tạo hóa đơn'}
      />
      <Helmet>
        <title>Thanh toán</title>
      </Helmet>
      <PageHeader
        title="Thanh toán"
        breadcrumbs={[
          {
            title: (
              <>
                <PieChartOutlined />
                <span>Trang chủ</span>
              </>
            ),
            menu: {
              items: DASHBOARD_ITEMS.map((d) => ({
                key: d.title,
                title: <Link to={d.path}>{d.title}</Link>,
              })),
            },
          },
          {
            title: 'Thanh toán',
          },
        ]}
      />
      <Row {...stylesContext?.rowProps}>
        <Col xs={24} lg={12}>
          <Flex
            vertical
            style={{ height: '100%', justifyContent: 'space-between' }}
          >
            <Card title="Tỷ lệ mở khoá chương">
              <Flex vertical gap="middle" style={{ padding: '12px 0' }}>
                <Typography.Title style={{ margin: 0 }}>8.48%</Typography.Title>
                <Row>
                  <Col sm={24} lg={8}>
                    <Space direction="vertical">
                      <Text>Tỷ lệ tháng 10</Text>
                      <Text type="secondary">125 lượt nhấp</Text>
                    </Space>
                  </Col>
                  <Col sm={24} lg={8}>
                    <Tag color="green-inverse" icon={<ArrowUpOutlined />}>
                      16.8%
                    </Tag>
                  </Col>
                </Row>
                <Row>
                  <Col sm={24} lg={8}>
                    <Space direction="vertical">
                      <Text>Tỷ lệ tháng 9</Text>
                      <Text type="secondary">233 Lượt nhấp</Text>
                    </Space>
                  </Col>
                  <Col sm={24} lg={8}>
                    <Tag color="red-inverse" icon={<ArrowDownOutlined />}>
                      -46.8%
                    </Tag>
                  </Col>
                </Row>
              </Flex>
            </Card>
          </Flex>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ thời gian xem chương" style={cardStyles}>
            <CategoriesChart />
          </Card>
        </Col>

        <Col span={24}>
          <DeliveryTableCard
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            title={'Trạng thái chương'}
            data={trucksDeliveryData}
            error={trucksDeliveryDataError}
            loading={trucksDeliveryDataLoading}
            isChapter={true}
          />
        </Col>
      </Row>
    </div>
  );
};
