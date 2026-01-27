import { Button, Col, Row, Space, Input, message, Checkbox } from 'antd';
import debounce from 'lodash/debounce';
import { Card, PageHeader, ProjectsTable } from '../../components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PieChartOutlined,
  LoginOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const ProjectsDashboardPage = () => {
  const [projectTabsKey, setProjectsTabKey] = useState<string>('all');
  const [isLoginAction, setIsLogin] = useState(false);
  const [isChangeInfo, setIsChangeInfo] = useState(false);
  const [loginStatus, setLoginStatus] = useState<boolean>(false);
  const [changeStatus, setChangeStatus] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<boolean>(false);
  const [errorProxy, setErrorProxy] = useState<boolean>(false);
  const [errorCaptcha, setErrorCaptcha] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [selectedProfileKeys, setSelectedProfileKeys] = useState<any[]>([]);
  const [rawProfiles, setRawProfiles] = useState<any[]>([]);
  const [dataProfiles, setDataProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { pathname } = useLocation();
  const resetFilters = () => {
    setLoginStatus(false);
    setChangeStatus(false);
    setErrorStatus(false);
    setErrorProxy(false);
    setErrorCaptcha(false);
    setSearchText('');
  };

  const filterProfiles = useCallback(
    (profiles: any[]) => {
      const keyword = (debouncedSearchText || '').trim().toLowerCase();
      return profiles.filter((p) => {
        const matchesLogin = !loginStatus || Boolean(p?.isLoginAction);
        const matchesChange = !changeStatus || Boolean(p?.isChangeInfo);
        const matchesError = !errorStatus || Boolean(p?.isError);
        const matchesProxy = !errorProxy || Boolean(p?.isProxyErr);
        const matchesCaptcha = !errorCaptcha || Boolean(p?.isCaptchaErr);

        const matchesSearch = !keyword
          ? true
          : (p?.name || '').toLowerCase().includes(keyword) ||
            (p?.username || '').toLowerCase().includes(keyword);

        return (
          matchesLogin &&
          matchesChange &&
          matchesError &&
          matchesProxy &&
          matchesCaptcha &&
          matchesSearch
        );
      });
    },
    [
      loginStatus,
      changeStatus,
      errorStatus,
      errorProxy,
      errorCaptcha,
      debouncedSearchText,
    ]
  );

  // Debounce input bằng lodash để tránh lọc liên tục khi gõ
  const debounceSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchText(value), 300),
    []
  );

  useEffect(() => {
    debounceSearch(searchText);
    return () => debounceSearch.cancel();
  }, [searchText, debounceSearch]);

  // Khi thay đổi bộ lọc, tự áp dụng nếu đã có dữ liệu tải về
  useEffect(() => {
    if (rawProfiles.length > 0) {
      setDataProfiles(filterProfiles(rawProfiles));
    }
  }, [filterProfiles, rawProfiles]);

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
      await (window as any).electronAPI.openBrowser(payload);
      message.destroy();
      message.success('Đã chạy xong tiến trình trên các hồ sơ đã chọn.');
      await fetchProfileData(1, 100);
    } catch (error) {
      message.error('Tiến trình đã xảy ra lỗi, vui lòng thử lại sau.');
    }
  };

  // Gọi fetch dữ liệu
  const fetchProfileData = useCallback(
    async (page: number, size: number) => {
      setIsLoading(true);
      try {
        const response = await (window as any).electronAPI.getProfileList({
          page: page,
          limit: size,
        });
        console.log(response);

        // response có cấu trúc { data: {...}, error: {...} }
        if (response.error?.code !== 0) {
          message.error(
            response.error?.message || 'Lỗi khi lấy danh sách hồ sơ'
          );
          return;
        }

        const profileArray = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setRawProfiles(profileArray);
        setDataProfiles(filterProfiles(profileArray));
      } catch (error) {
        console.log(error);
        if ((error as Error).name !== 'AbortError') {
          console.error('Lỗi fetch:', error);
          message.error('Lỗi khi lấy danh sách hồ sơ');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [filterProfiles]
  );

  const handleApplyFilters = async () => {
    await fetchProfileData(1, 100);
  };

  const handleSyncProfiles = async () => {
    await fetchProfileData(1, 100);
  };

  useEffect(() => {
    fetchProfileData(1, 100);
  }, [pathname, fetchProfileData]);

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
                Đã đăng nhập
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
              <Checkbox
                checked={errorCaptcha}
                indeterminate={false}
                onChange={(e) => setErrorCaptcha(e.target.checked)}
              >
                Lỗi robot
              </Checkbox>
              <Input
                placeholder="Tìm kiếm theo tên / tài khoản"
                allowClear
                style={{ width: 260 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => handleApplyFilters()}
              />
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
                  onClick={() => handleSyncProfiles()}
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
              onSelectionChange={(_keys, rows) => setSelectedProfileKeys(rows)}
              dataProfiles={dataProfiles}
              isLoading={isLoading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
