import { Table, Tag, Typography } from 'antd';

import { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

type ProjectsTableProps = {
  onSelectionChange?: (selectedKeys: any[], selectedRows: any[]) => void;
  dataProfiles?: any[];
  isLoading?: boolean;
};

export const ProjectsTable = ({
  onSelectionChange,
  dataProfiles,
  isLoading,
}: ProjectsTableProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

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
      width: 80,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: 'Mật khẩu mới',
      dataIndex: 'new_password',
      key: 'new_password',
      width: 80,
      render: (_: any) => <span className="text-capitalize">{_}</span>,
    },
    {
      title: '2FA key',
      dataIndex: 'tfa_secret',
      key: 'tfa_secret',
      width: 200,
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
        <Tag color={value ? 'red' : 'green'}>
          {!value ? 'Bình thường' : 'Error'}
        </Tag>
      ),
    },

    {
      title: 'Thông tin lỗi',
      dataIndex: 'errorInfo',
      key: 'errorInfo',
      width: 250,
      render: (_: any) => (
        <span className="text-capitalize">{_}</span>
        // <Typography.Paragraph
        //   ellipsis={{ rows: 1 }}
        //   className="text-capitalize"
        //   style={{ marginBottom: 0 }}
        // >
        //   {_}
        // </Typography.Paragraph>
      ),
    },
  ];

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

  return (
    <div>
      <Table
        rowSelection={rowSelection}
        dataSource={dataProfiles}
        columns={COLUMNS}
        className="overflow-scroll"
        scroll={{ x: 3000 }}
        pagination={paginationConfig}
        loading={isLoading}
        rowKey="profile_id"
      />
    </div>
  );
};
