import { Table, TableProps, Typography } from 'antd';
import { Clients } from '../../../../types';
import { UserAvatar } from '../../../index.ts';

const COLUMNS = [
  {
    title: 'Tên khách hàng',
    dataIndex: 'client_name',
    key: 'c_name',
    render: (_: any, { first_name }: Clients) => (
      <UserAvatar fullName={`${first_name}`} mark={true} />
    ),
  },
  {
    title: 'Số tiền',
    dataIndex: 'total_price',
    key: 'client_amount',
    render: (_: any) => <Typography.Text>{_} VND</Typography.Text>,
  },
];

type Props = {
  data: Clients[];
} & TableProps<Clients>;

export const ClientsTable = ({ data, ...others }: Props) => (
  <Table
    dataSource={data}
    columns={COLUMNS}
    key="client_table"
    size="middle"
    className="overflow-scroll"
    rowKey={(data) => data.client_id}
    {...others}
  />
);
