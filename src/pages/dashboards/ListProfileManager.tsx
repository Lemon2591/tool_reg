import { Button, Col, Row, Space, Input, message, Checkbox } from 'antd';
import { Card, PageHeader, ProjectsTable } from '../../components';
import { useState } from 'react';
import {
  PieChartOutlined,
  LoginOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const ProjectsDashboardPage = () => {
  const [projectTabsKey, setProjectsTabKey] = useState<string>('all');
  const [isLoginAction, setIsLogin] = useState(false);
  const [isChangeInfo, setIsChangeInfo] = useState(false);
  const [loginStatus, setLoginStatus] = useState<boolean>(false);
  const [changeStatus, setChangeStatus] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<boolean>(false);
  const [errorProxy, setErrorProxy] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [selectedProfileKeys, setSelectedProfileKeys] = useState<any[]>([]);

  const resetFilters = () => {
    setLoginStatus(false);
    setChangeStatus(false);
    setErrorStatus(false);
    setErrorProxy(false);
    setSearchText('');
  };

  const toggleLogin = () => {
    if (isLoginAction) {
      // tắt login thì cũng tắt luôn change info
      setIsLogin(false);
      setIsChangeInfo(false);
    } else {
      setIsLogin(true);
    }
  };

  const toggleChangeInfo = () => {
    if (isChangeInfo) {
      setIsChangeInfo(false);
    } else {
      // bật change info thì auto bật login
      setIsChangeInfo(true);
      setIsLogin(true);
    }
  };

  const onProjectsTabChange = (key: string) => {
    setProjectsTabKey(key);
  };

  const handleRunProfiles = async () => {
    try {
      if (!isLoginAction && !isChangeInfo) {
        message.warning('Vui lòng chọn chức năng trước khi khởi chạy.');
        return;
      }
      const payload = {
        isAutoLogin: isLoginAction,
        isAutoChange: isChangeInfo,
        profileIds: selectedProfileKeys,
      };
      message.loading('Đang khởi tạo trình duyệt...', 0);

      // 3. Gọi lệnh thông qua cầu nối IPC
      const result = await (window as any).electronAPI.openBrowser(payload);
      message.destroy();
      if (result.success) {
        message.success('Đã mở trình duyệt thành công!');
      } else {
        message.error('Lỗi: ' + result.error);
      }
    } catch (error) {
      console.log(error);
      message.error('Dữ liệu không hợp lệ!');
    }
  };

  return (
    <div>
      <Helmet>
        <title>Điều khiển</title>
      </Helmet>
      <PageHeader
        title="Điều khiển"
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
            title: 'Điều khiển',
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
          <Card title="Chọn chức năng">
            <Space>
              <Button
                type={isLoginAction ? 'primary' : 'default'}
                icon={<LoginOutlined />}
                onClick={toggleLogin}
              >
                Chức năng đăng nhập
              </Button>

              <Button
                type={isChangeInfo ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={toggleChangeInfo}
              >
                Chức năng đổi thông tin
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Bộ lọc">
            <Space wrap>
              <Checkbox
                checked={loginStatus}
                indeterminate={false}
                onChange={(e) => setLoginStatus(e.target.checked)}
              >
                Đang đăng nhập
              </Checkbox>
              <Checkbox
                checked={changeStatus}
                indeterminate={false}
                onChange={(e) => setChangeStatus(e.target.checked)}
              >
                Đã thay đổi thông tin
              </Checkbox>
              <Checkbox
                checked={errorStatus}
                indeterminate={false}
                onChange={(e) => setErrorStatus(e.target.checked)}
              >
                Có lỗi tiến trình
              </Checkbox>
              <Checkbox
                checked={errorProxy}
                indeterminate={false}
                onChange={(e) => setErrorProxy(e.target.checked)}
              >
                Lỗi Proxy
              </Checkbox>
              <Input
                placeholder="Tìm kiếm theo tên / tài khoản"
                allowClear
                style={{ width: 260 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => setSearchText(searchText.trim())}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setSearchText(searchText.trim())}
              >
                Tìm kiếm
              </Button>
              <Button onClick={resetFilters}>Xóa bộ lọc</Button>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Điều khiển"
            extra={
              <Space>
                <Button
                  icon={<SyncOutlined />}
                  type="primary"
                  loading={false}
                  // onClick={() => setIsOpen(!isOpen)}
                >
                  Đồng bộ
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  type="primary"
                  loading={false}
                  onClick={() => handleRunProfiles()}
                >
                  Khởi chạy
                </Button>
              </Space>
            }
            activeTabKey={projectTabsKey}
            onTabChange={onProjectsTabChange}
          >
            <ProjectsTable
              onSelectionChange={(keys, rows) => setSelectedProfileKeys(rows)}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
