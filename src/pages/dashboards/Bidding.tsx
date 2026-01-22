import {
  Button,
  Col,
  Flex,
  Popover,
  Row,
  RowProps,
  Select,
  Typography,
} from 'antd';
import {
  AuctionCarousel,
  BiddingCategoriesCard,
  Card,
  CreatorsCard,
  PageHeader,
  TopItemsCard,
  TransactionsCard,
} from '../../components';
import {
  HomeOutlined,
  PieChartOutlined,
  QuestionOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useFetchData } from '../../hooks';
import CountUp from 'react-countup';

const ROW_PROPS: RowProps = {
  gutter: [
    { xs: 8, sm: 16, md: 24, lg: 32 },
    { xs: 8, sm: 16, md: 24, lg: 32 },
  ],
};

export const BiddingDashboardPage = () => {
  const {
    data: auctionCreatorsData,
    loading: auctionCreatorsDataLoading,
    error: auctionCreatorsDataError,
  } = useFetchData('../mocks/AuctionCreators.json');

  const value: number = 1000000000;

  return (
    <div>
      <Helmet>
        <title>Thể loại</title>
      </Helmet>
      <PageHeader
        title="Thể loại"
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
            title: 'Thể loại',
          },
        ]}
      />
      <Row {...ROW_PROPS}>
        <Col xs={24} md={24}>
          <Typography.Title level={4}>Thể loại</Typography.Title>
          <Row {...ROW_PROPS}>
            <Col md={12} xl={8}>
              <Card title="Tổng số thể loại">
                <Flex vertical gap="middle">
                  <Typography.Title level={2}>
                    {typeof value === 'number' ? (
                      <>
                        <CountUp end={value} />
                        {<span>&nbsp;VND</span>}
                      </>
                    ) : (
                      value
                    )}
                  </Typography.Title>
                </Flex>
              </Card>
            </Col>
            <Col md={12} xl={8}>
              <Card title="Tổnng số tiền đã thanh toán">
                <Flex vertical gap="middle">
                  <Typography.Title level={2}>
                    {typeof value === 'number' ? (
                      <>
                        <CountUp end={value} />
                        {<span>&nbsp;VND</span>}
                      </>
                    ) : (
                      value
                    )}
                  </Typography.Title>
                </Flex>
              </Card>
            </Col>
            <Col md={12} xl={8}>
              <Card title="Tổnng số tiền chưa thanh toán">
                <Flex vertical gap="middle">
                  <Typography.Title level={2}>
                    {typeof value === 'number' ? (
                      <>
                        <CountUp end={value} />
                        {<span>&nbsp;VND</span>}
                      </>
                    ) : (
                      value
                    )}
                  </Typography.Title>
                </Flex>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col xs={24} xl={24}>
          <CreatorsCard
            data={auctionCreatorsData}
            loading={auctionCreatorsDataLoading}
            error={auctionCreatorsDataError}
          />
        </Col>
      </Row>
    </div>
  );
};
