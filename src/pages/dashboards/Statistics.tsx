import { Col, Row } from 'antd';
import {
  MarketingStatsCard,
  PageHeader,
  VisitorsChartCard,
} from '../../components';
import { PieChartOutlined } from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';

export const MarketingDashboardPage = () => {
  const stylesContext = useStylesContext();

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
            title="Tổng số lượt đã chạy"
            value={529148819}
            style={{ height: '100%' }}
            typePage={'view'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            data={[337, 274, 497, 81]}
            title="Tổng lượt tự động đăng nhập"
            value={2240}
            style={{ height: '100%' }}
            typePage={'stories'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            data={[337, 274, 497, 81]}
            title="Tổng số lượt thay thông tin"
            value={100}
            style={{ height: '100%' }}
            typePage={'category'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MarketingStatsCard
            title="Tổng số lượt lỗi"
            diff={6.3}
            value={0}
            style={{ height: '100%' }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 20 }}>
        <Row {...stylesContext?.rowProps}>
          <Col span={24} style={{ flex: 1 }}>
            <VisitorsChartCard />
          </Col>
        </Row>
      </div>
    </div>
  );
};
