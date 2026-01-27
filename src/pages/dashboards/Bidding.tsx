import { Col, Flex, Row, RowProps, Typography } from 'antd';
import { Card, CreatorsCard, PageHeader } from '../../components';
import { PieChartOutlined } from '@ant-design/icons';
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
        <title>Cài đặt</title>
      </Helmet>
      <PageHeader
        title="Cài đặt"
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
            title: 'Cài đặt',
          },
        ]}
      />
      <Row {...ROW_PROPS}>
        <Col xs={24} md={24}>
          <Typography.Title level={4}>Cài đặt</Typography.Title>
          <Row {...ROW_PROPS}>
            <Col md={12} xl={8}>
              <Card title="Tổng số Cài đặt">
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
