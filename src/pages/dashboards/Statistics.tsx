import { Col, Row } from 'antd';
import {
  MarketingSocialStatsCard,
  MarketingStatsCard,
  PageHeader,
  VisitorsChartCard,
} from '../../components';
import { HomeOutlined, PieChartOutlined } from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import { useFetchData } from '../../hooks';
import { DeliveryTableCard } from '../../components';

export const MarketingDashboardPage = () => {
  const stylesContext = useStylesContext();
  const {
    data: trucksDeliveryData,
    loading: trucksDeliveryDataLoading,
    error: trucksDeliveryDataError,
  } = useFetchData('../mocks/TruckDeliveries.json');

  return (
    <div>
      <Helmet>
        <title>Thống kê dữ liệu</title>
      </Helmet>
      <PageHeader
        title="Thống kê dữ liệu"
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
            title: 'Thống kê',
          },
        ]}
      />
      <Row {...stylesContext?.rowProps}>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            title="Tổng số lượt xem toàn trang"
            value={529148819}
            style={{ height: '100%' }}
            typePage={'view'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            data={[337, 274, 497, 81]}
            title="Tổng số truyện"
            value={2240}
            style={{ height: '100%' }}
            typePage={'stories'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            data={[337, 274, 497, 81]}
            title="Tổng số thể loại"
            value={100}
            style={{ height: '100%' }}
            typePage={'category'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            title="Tổng người dùng"
            diff={6.3}
            value={0}
            style={{ height: '100%' }}
          />
        </Col>
        <Col span={24}>
          <VisitorsChartCard />
        </Col>
        <Col span={24}>
          <DeliveryTableCard
            title={'Trạng thái dữ liệu'}
            data={trucksDeliveryData}
            error={trucksDeliveryDataError}
            loading={trucksDeliveryDataLoading}
            isChapter={false}
          />
        </Col>
      </Row>
    </div>
  );
};
