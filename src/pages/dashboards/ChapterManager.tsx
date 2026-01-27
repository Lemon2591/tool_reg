import { Col, Flex, Row, Space, Tag, Typography } from 'antd';
import { Card, DeliveryTableCard, PageHeader } from '../../components';
import { Pie } from '@ant-design/charts';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import { CSSProperties, useState } from 'react';
import { useFetchData } from '../../hooks';
import { ReceiptModal } from '../../components/dashboard/ecommerce';

const { Text } = Typography;

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
