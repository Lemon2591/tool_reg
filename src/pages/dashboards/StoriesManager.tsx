import { Button, Col, Row, Segmented, Space } from 'antd';
import { Card, PageHeader, ProjectsTable } from '../../components';
import { CustomerModal } from '../../components/dashboard/projects';
import { Column } from '@ant-design/charts';
import { Projects } from '../../types';
import { useState } from 'react';
import { PieChartOutlined, PlusOutlined } from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useFetchData } from '../../hooks';

const RevenueColumnChart = () => {
  const data = [
    {
      name: 'Income',
      period: '01',
      value: 81.4,
    },
    {
      name: 'Income',
      period: '02',
      value: 47,
    },
    {
      name: 'Income',
      period: '03',
      value: 20.3,
    },
    {
      name: 'Income',
      period: '04',
      value: 24,
    },
    {
      name: 'Income',
      period: '05',
      value: 118.9,
    },
    {
      name: 'Income',
      period: '06',
      value: 28.8,
    },
    {
      name: 'Income',
      period: '07',
      value: 39.3,
    },
    {
      name: 'Income',
      period: '08',
      value: 81.4,
    },
    {
      name: 'Income',
      period: '09',
      value: 47,
    },
    {
      name: 'Income',
      period: '10',
      value: 20.3,
    },
    {
      name: 'Income',
      period: '11',
      value: 24,
    },
    {
      name: 'Income',
      period: '12',
      value: 24,
    },
  ];
  const config = {
    data,
    isGroup: true,
    xField: 'period',
    yField: 'value',
    seriesField: 'name',

    /** set color */
    // color: ['#1ca9e6', '#f88c24'],

    /** Set spacing */
    // marginRatio: 0.1,
    label: {
      // Label data label position can be manually configured
      position: 'middle',
      // 'top', 'middle', 'bottom'
      // Configurable additional layout method
      layout: [
        // Column chart data label position automatically adjusted
        {
          type: 'interval-adjust-position',
        }, // Data label anti-obstruction
        {
          type: 'interval-hide-overlap',
        }, // Data label text color automatically adjusted
        {
          type: 'adjust-color',
        },
      ],
    },
  };
  // @ts-ignore
  return <Column {...config} />;
};

const PROJECT_TABS = [
  {
    key: 'all',
    label: 'Tất cả truyện',
  },
  {
    key: 'inProgress',
    label: 'Xu hướng',
  },
  {
    key: 'onHold',
    label: 'Top lượt xem',
  },
  {
    key: 'inProgress',
    label: 'Đã ẩn',
  },

  {
    key: 'onHold',
    label: 'Đã xoá',
  },
];

export const ProjectsDashboardPage = () => {
  const { data: projectsData } = useFetchData('../mocks/Projects.json');

  const [projectTabsKey, setProjectsTabKey] = useState<string>('all');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const PROJECT_TABS_CONTENT: Record<string, React.ReactNode> = {
    all: <ProjectsTable key="all-projects-table" data={projectsData} />,
    inProgress: (
      <ProjectsTable
        key="in-progress-projects-table"
        data={projectsData.filter((_: Projects) => _.status === 'in progress')}
      />
    ),
    onHold: (
      <ProjectsTable
        key="on-hold-projects-table"
        data={projectsData.filter((_: Projects) => _.status === 'on hold')}
      />
    ),
  };

  const onProjectsTabChange = (key: string) => {
    setProjectsTabKey(key);
  };

  return (
    <div>
      <CustomerModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        title={'Tạo truyện mới'}
      />
      <Helmet>
        <title>Quản lý truyện</title>
      </Helmet>
      <PageHeader
        title="Quản lý truyện"
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
            title: 'Quản lý truyện',
          },
        ]}
      />
      <Row
        gutter={[
          { xs: 8, sm: 16, md: 24, lg: 32 },
          { xs: 8, sm: 16, md: 24, lg: 32 },
        ]}
      >
        <Col span={24}>
          <Card
            title="Biểu đồ top lượt xem"
            extra={<Segmented options={['Ngày', 'Tuần', 'Tháng', 'Năm']} />}
          >
            <RevenueColumnChart />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Quản lý truyện"
            extra={
              <Space>
                <Button icon={<PlusOutlined />} onClick={() => setIsOpen(true)}>
                  Tạo mới truyện
                </Button>
              </Space>
            }
            tabList={PROJECT_TABS}
            activeTabKey={projectTabsKey}
            onTabChange={onProjectsTabChange}
          >
            {PROJECT_TABS_CONTENT[projectTabsKey]}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
