import { Table, Tag, Typography, message } from 'antd';

import { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type ProjectsTableProps = {
  onSelectionChange?: (selectedKeys: any[], selectedRows: any[]) => void;
};

export const ProjectsTable = ({ onSelectionChange }: ProjectsTableProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [dataProfiles, setDataProfiles] = useState<any>([]);
  const { pathname } = useLocation();

  const COLUMNS: ColumnsType<any> = [
    {
      title: 'Tên Profile',
      dataIndex: 'name',
      key: 'name',
      width: 50,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
      width: 50,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: 'Mật khẩu gốc',
      dataIndex: 'password',
      key: 'password',
      width: 50,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: 'Mật khẩu mới',
      dataIndex: 'new_password',
      key: 'new_password',
      width: 50,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: '2FA key',
      dataIndex: 'tfa_secret',
      key: 'tfa_secret',
      width: 50,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },

    {
      title: 'Thông tin Proxy',
      dataIndex: 'proxy_ip',
      key: 'proxy_ip',
      width: 100,
      render: (_: any) => (
        <Typography.Paragraph
          ellipsis={{ rows: 1 }}
          className="text-capitalize"
          style={{ marginBottom: 0 }}
        >
          {_}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'Loại Proxy',
      dataIndex: 'proxy_type',
      key: 'proxy_type',
      width: 30,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: 'Trạng thái đăng nhập',
      dataIndex: 'isLoginAction',
      key: 'isLoginAction',
      width: 10,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Đang đăng nhập' : 'Chưa đăng nhập'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái thay đổi thông tin',
      dataIndex: 'isChangeInfo',
      key: 'isChangeInfo',
      width: 70,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Đã thay đổi' : 'Chưa thay đổi'}
        </Tag>
      ),
    },
    {
      title: 'Tiến trình lỗi',
      dataIndex: 'isError',
      key: 'isError',
      width: 50,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Bình thường' : 'Error'}
        </Tag>
      ),
    },

    {
      title: 'Thông tin lỗi',
      dataIndex: 'errorInfo',
      key: 'errorInfo',
      width: 50,
      render: (_: any) => (
        <Typography.Paragraph
          ellipsis={{ rows: 1 }}
          className="text-capitalize"
          style={{ marginBottom: 0 }}
        >
          {_}
        </Typography.Paragraph>
      ),
    },
  ];

  // Gọi fetch dữ liệu
  const fetchProfileData = useCallback(async (page: number, size: number) => {
    setIsLoading(true);
    try {
      const response = await (window as any).electronAPI.getProfileList({
        page: page,
        limit: size,
      });

      // response có cấu trúc { data: {...}, error: {...} }
      if (response.error?.code !== 0) {
        message.error(response.error?.message || 'Lỗi khi lấy danh sách hồ sơ');
        return;
      }

      const profileArray = response.data?.data || [];
      setDataProfiles(profileArray);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Lỗi fetch:', error);
        message.error('Lỗi khi lấy danh sách hồ sơ');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: any[], selectedRows: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      if (onSelectionChange) {
        onSelectionChange(newSelectedRowKeys, selectedRows);
      }
    },
    columnWidth: 20,
  };

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100', '200'],
    onChange: (page: number, size?: number) => {
      setCurrentPage(page);
      if (size) setPageSize(size);
    },
  };

  useEffect(() => {
    fetchProfileData(1, 100);
  }, [pathname, fetchProfileData]);

  return (
    <div>
      <Table
        rowSelection={rowSelection}
        dataSource={dataProfiles}
        columns={COLUMNS}
        className="overflow-scroll"
        scroll={{ x: 2500 }}
        pagination={paginationConfig}
        loading={isLoading}
        rowKey="profile_id"
      />
    </div>
  );
};
