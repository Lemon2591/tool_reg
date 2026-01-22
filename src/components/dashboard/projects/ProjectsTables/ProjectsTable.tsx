import {
  Badge,
  BadgeProps,
  Button,
  Modal,
  Space,
  Table,
  TableProps,
  Tag,
  TagProps,
  Typography,
  Tooltip,
} from 'antd';
import { Projects } from '../../../../types';
import { ColumnsType } from 'antd/es/table';
import {
  CloseCircleOutlined,
  EditOutlined,
  PicCenterOutlined,
} from '@ant-design/icons';

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

const COLUMNS: ColumnsType<any> = [
  {
    title: 'Tên truyện',
    dataIndex: 'project_name',
    key: 'proj_name',
    render: (_: any, { project_name }: Projects) => (
      <Typography.Paragraph
        ellipsis={{ rows: 1 }}
        className="text-capitalize"
        style={{ marginBottom: 0 }}
      >
        {project_name.substring(0, 20)}
      </Typography.Paragraph>
    ),
    fixed: 'left',
    width: 50,
  },
  {
    title: 'Người đăng',
    dataIndex: 'client_name',
    key: 'proj_client_name',
    width: 50,
    fixed: 'left',
  },
  {
    title: 'Tác giả',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Tổng số chương',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Mô tả truyện',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Đường dẫn ảnh',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Tổng số view',
    dataIndex: 'project_category',
    key: 'proj_category',
    width: 100,
    render: (_: any) => <span className="text-capitalize">{_}</span>,
  },
  {
    title: 'Ngày đăng',
    dataIndex: 'priority',
    key: 'proj_priority',
    width: 100,
    render: (_: any) => {
      let color: TagProps['color'];

      if (_ === 'low') {
        color = 'cyan';
      } else if (_ === 'medium') {
        color = 'geekblue';
      } else {
        color = 'magenta';
      }

      return (
        <Tag color={color} className="text-capitalize">
          {_}
        </Tag>
      );
    },
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'proj_status',
    width: 100,
    render: (_: any) => {
      let status: BadgeProps['status'];

      if (_ === 'on hold') {
        status = 'default';
      } else if (_ === 'completed') {
        status = 'success';
      } else {
        status = 'processing';
      }

      return <Badge status={status} text={_} className="text-capitalize" />;
    },
  },
  {
    title: 'Link truyện',
    dataIndex: 'team_size',
    key: 'proj_team_size',
    width: 100,
  },
  {
    title: 'Thao tác',
    dataIndex: 'start_date',
    key: 'proj_start_date',
    width: 65,
    fixed: 'right',
    render: (_: any) => {
      return (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button>
              <EditOutlined />
            </Button>
          </Tooltip>

          <Tooltip title="Ẩn truyện">
            <Button onClick={() => showConfirm('hidden')}>
              <PicCenterOutlined />
            </Button>
          </Tooltip>

          <Tooltip title="Xoá truyện">
            <Button danger onClick={() => showConfirm('delete')}>
              <CloseCircleOutlined />
            </Button>
          </Tooltip>
        </Space>
      );
    },
  },
];

type Props = {
  data: Projects[];
} & TableProps<Projects>;

export const ProjectsTable = ({ data, ...others }: Props) => {
  return (
    <Table
      dataSource={data}
      columns={COLUMNS}
      className="overflow-scroll"
      scroll={{ x: 3000 }}
      // loading={true}
      {...others}
    />
  );
};
