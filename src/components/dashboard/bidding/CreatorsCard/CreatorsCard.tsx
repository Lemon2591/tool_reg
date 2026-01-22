import { ReactNode } from 'react';
import { Alert, Button, CardProps, Table, TableColumnsType, Tag } from 'antd';
import { AuctionCreator } from '../../../../types';
import { Card, UserAvatar } from '../../../index';
import { UserAddOutlined } from '@ant-design/icons';
import './styles.css';

const COLUMNS: TableColumnsType<AuctionCreator> = [
  {
    key: 'creators_name',
    dataIndex: 'first_name',
    title: 'Tên khách hàng',
    render: (_, { first_name, last_name, favorite_color }) => (
      <>{`${first_name} ${last_name}`}</>
    ),
  },
  {
    key: 'sold_items',
    dataIndex: 'sales_count',
    title: 'Mã hóa đơn',
  },
  {
    key: 'sold_items',
    dataIndex: 'sales_count',
    title: 'Mã hóa đơn',
  },
  {
    key: 'sold_items',
    dataIndex: 'sales_count',
    title: 'Ngày thanh toán',
  },

  {
    key: 'sold_items',
    dataIndex: 'sales_count',
    title: 'Số tiền thanh toán',
  },
  {
    key: 'creator_actions',
    dataIndex: 'actions',
    title: 'Phương thức thanh toán',
    render: () => <>{<Tag color={'green'}>Tiền mặt</Tag>}</>,
  },
  {
    key: 'creator_actions',
    dataIndex: 'actions',
    title: 'Ghi chú',
    render: () => <>Thanh toán hóa đơn</>,
  },
];

type Props = {
  data?: AuctionCreator[];
  loading?: boolean;
  error?: ReactNode;
} & CardProps;

export const CreatorsCard = ({ data, loading, error, ...others }: Props) => {
  return error ? (
    <Alert
      message="Error"
      description={error.toString()}
      type="error"
      showIcon
    />
  ) : (
    <Card
      title="Dữ liệu thanh toán"
      extra={<Button>See all creators</Button>}
      className="card"
      {...others}
    >
      <Table
        dataSource={data}
        columns={COLUMNS}
        size="middle"
        loading={loading}
        className="overflow-scroll"
      />
    </Card>
  );
};
