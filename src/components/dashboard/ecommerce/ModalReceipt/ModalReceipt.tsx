import { Card, DatePicker, Modal, Select, Space, AutoComplete } from 'antd';
import { Button, Col, Form, Input, Row } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';

type Props = any;
type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  subscription?: 'free' | 'pro' | 'enterprise' | 'custom';
  id?: string;
  status?: 'active' | 'inactive';
  customer_name?: string;
};

export const ReceiptModal = ({
  title,
  handleOk,
  onCancel,
  isOpen,
  ...others
}: Props) => {
  const onFinish = async () => {
    // setLoading(true);
    // const payload = {
    //   full_name: `${values?.firstName} ${values?.lastName}`,
    //   email: values?.email,
    //   password: values?.password,
    //   cPassword: values?.cPassword,
    // };
    // try {
    //   await registerAuth(payload);
    //   message.success('Đăng ký thành công!');
    //   navigate('/auth/signin');
    // } catch (error: any) {
    //   message.error(error?.response?.data?.message || 'Đăng ký thất bại!');
    // } finally {
    //   setLoading(false);
    // }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const showConfirm = () => {
    Modal.confirm({
      title: 'Bạn có muốn hủy không ?',
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      centered: true,
      onOk() {
        onCancel();
        // TODO: Thực hiện hành động tại đây
      },
      onCancel() {
        console.log('Người dùng đã xác nhận');
      },
    });
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onOk={handleOk}
      onCancel={onCancel}
      {...others}
      width="auto"
      centered
      footer={false}
    >
      <Card>
        <Form
          name="user-profile-details-form"
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="on"
          requiredMark={false}
        >
          <Row gutter={[16, 0]}>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Tên khách hàng, doanh nghiệp"
                name="customer_name"
                rules={[{ required: true, message: 'Please input your id!' }]}
              >
                <AutoComplete
                  //   onSearch={handleSearch}
                  filterOption={(inputValue, option) =>
                    option!.value
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                  placeholder="Tìm kiếm khách hàng"
                  options={[
                    { value: 'Burns Bay Road' },
                    { value: 'Downing Street' },
                    { value: 'Wall Street' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Tên người liên hệ"
                name="id"
                rules={[{ required: true, message: 'Please input your id!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Địa chỉ email"
                name="firstName"
                rules={[
                  { required: true, message: 'Please input your first name!' },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Số điện thoại"
                name="middleName"
                rules={[
                  { required: true, message: 'Please input your middle name!' },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Ngày bắt đầu"
                // name="startDate"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder={'Chọn ngày bắt đầu'}
                />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Ngày kết thúc"
                // name="startDate"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder={'Chọn ngày kết thúc'}
                />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Ngày sinh"
                // name="startDate"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder={'Chọn ngày sinh'}
                />
              </Form.Item>
            </Col>
            <Col sm={24} lg={12}>
              <Form.Item<FieldType>
                label="Nguồn khách hàng"
                name="subscription"
                rules={[
                  {
                    required: true,
                    message: 'Please select your subscription!',
                  },
                ]}
              >
                <Select
                  options={[
                    { value: 'free', label: 'Free' },
                    { value: 'pro', label: 'Pro' },
                    { value: 'enterprise', label: 'Enterprise' },
                    { value: 'custom', label: 'Custom', disabled: true },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="default"
                  htmlType="submit"
                  icon={<CloseOutlined />}
                  onClick={showConfirm}
                >
                  Hủy tạo
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Lưu khách hàng
                </Button>
              </Space>
            </Form.Item>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};
