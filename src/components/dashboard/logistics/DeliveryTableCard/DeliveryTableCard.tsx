import {
  Alert,
  Button,
  CardProps,
  Table,
  TableProps,
  Progress,
  ProgressProps,
  Space,
  Tooltip,
  Modal,
  Tag,
  message,
} from 'antd';
import { TruckDelivery } from '../../../../types';
import { ReactNode, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { Card } from '../../../index.ts';
import {
  PicCenterOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from '@ant-design/icons';

type TabKeys = '0' | '1' | '2' | '3' | string;

type TabList = {
  key: TabKeys;
  tab: string;
}[];

const showConfirm = (type: string) => {
  if (type === 'hidden') {
    Modal.confirm({
      title: 'Bạn có muốn ẩn không ?',
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      centered: true,
      onOk() {
        // onCancel();
        // TODO: Thực hiện hành động tại đây
      },
      onCancel() {
        console.log('Người dùng đã xác nhận');
      },
    });
  } else {
    Modal.confirm({
      title: 'Bạn có muốn xóa không ?',
      content: 'Hành động này sẽ không thể khôi phục.',
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      centered: true,
      onOk() {
        // onCancel();
        // TODO: Thực hiện hành động tại đây
      },
      onCancel() {
        console.log('Người dùng đã xác nhận');
      },
    });
  }
};

const PROGRESS_PROPS: ProgressProps = {
  style: {
    width: 300,
  },
};

const TAB_LIST: TabList = [
  {
    key: '0',
    tab: 'Tất cả truyện',
  },
  {
    key: '1',
    tab: 'Đã ẩn',
  },
  {
    key: '2',
    tab: 'Đã xoá',
  },
];

const handleOpenBrowser = async (record?: any) => {
  try {
    // 1. Tách chuỗi Proxy (host:port:user:pass)
    const proxyRaw =
      'res-v2.pr.plainproxies.com:8080:AxHMrB8zQokzvshr-country-US-session-447349-ttl-2592000:lU6YD3kSww6S';
    const p = proxyRaw.split(':');

    // 2. Chuẩn bị dữ liệu gửi sang Electron
    const payload = {
      isAutoLogin: true,
      isAutoChange: true,
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

const DELIVERY_TABLE_COLUMNS: ColumnsType<TruckDelivery> = [
  {
    title: 'Mã truyện',
    dataIndex: 'receipt_code',
    key: 'receipt_code',
    width: 50,
  },
  {
    title: 'Tên truyện',
    dataIndex: 'customer_name',
    key: 'customer_name',
    width: 250,
  },
  {
    title: 'Ngày đăng',
    dataIndex: 'due_date',
    key: 'due_date',
    width: 200,
  },
  {
    title: 'Người đăng',
    dataIndex: 'sub_total',
    key: 'sub_total',
    width: 200,
    // render: (_: any) => <UserAvatar fullName={_} />,
  },
  {
    title: 'Lượt xem',
    dataIndex: 'Còn lại',
    key: 'remand_price',
    width: 150,
  },
  {
    title: 'Tổng chương',
    dataIndex: 'total',
    key: 'total',
    width: 150,
    // render: (_: any) => <span>${numberWithCommas(_)}</span>,
  },
  {
    title: 'Trạng thái',
    width: 50,

    render: (_: any) => {
      return (
        <Tag color={'green'} key={_}>
          Hiển thị
        </Tag>
      );
    },
  },
  {
    title: 'Thao tác',
    dataIndex: 'start_date',
    key: 'proj_start_date',
    width: 30,
    fixed: 'right',
    render: (_: any) => {
      return (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button onClick={() => handleOpenBrowser()}>
              <EditOutlined />
            </Button>
          </Tooltip>
          <Tooltip title="Ẩn truyện">
            <Button onClick={() => showConfirm('hidden')}>
              <PicCenterOutlined />
            </Button>
          </Tooltip>
          <Tooltip title="Xóa truyên">
            <Button danger onClick={() => showConfirm('delete')}>
              <CloseCircleOutlined />
            </Button>
          </Tooltip>
        </Space>
      );
    },
  },
];

type DeliveryTableProps = {
  data?: TruckDelivery[];
} & TableProps<any>;

const ControlTableReceipt = ({
  isChapter,
  isOpen,
  setIsOpen,
}: {
  isChapter?: boolean;
  isOpen?: boolean;
  setIsOpen?: any;
}) => {
  return (
    <div>
      {isChapter ? (
        <div>
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setIsOpen(!isOpen)}>
              Tạo mới chương
            </Button>
          </Space>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

const DeliveryTable = ({ data, ...others }: DeliveryTableProps) => {
  return (
    <Table
      dataSource={data || []}
      columns={DELIVERY_TABLE_COLUMNS}
      className="overflow-scroll"
      {...others}
    />
  );
};

type Props = {
  data?: TruckDelivery[];
  loading?: boolean;
  error?: ReactNode;
  title?: string;
  isChapter?: boolean;
  isOpen?: boolean;
  setIsOpen?: any;
} & CardProps;

export const DeliveryTableCard = ({
  data,
  loading,
  error,
  title,
  isChapter,
  isOpen,
  setIsOpen,
  ...others
}: Props) => {
  const [activeTabKey, setActiveTabKey] = useState<TabKeys>('0');

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  return (
    <Card
      title={title || 'Deliveries'}
      extra={
        <ControlTableReceipt
          isChapter={isChapter}
          setIsOpen={setIsOpen}
          isOpen={isOpen}
        />
      }
      tabList={TAB_LIST}
      activeTabKey={activeTabKey}
      onTabChange={onTabChange}
      {...others}
    >
      {error ? (
        <Alert
          message="Error"
          description={error.toString()}
          type="error"
          showIcon
        />
      ) : (
        <DeliveryTable data={data} loading={loading} />
      )}
    </Card>
  );
};
