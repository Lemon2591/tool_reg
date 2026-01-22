import {
  Button,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Row,
  theme,
  Typography,
} from 'antd';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerAuth } from '../../redux/service/authService';

const { Title, Text, Link } = Typography;

type FieldType = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  cPassword?: string;
  terms?: boolean;
};

export const SignUpPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    const payload = {
      full_name: `${values?.firstName} ${values?.lastName}`,
      email: values?.email,
      password: values?.password,
      cPassword: values?.cPassword,
    };
    try {
      await registerAuth(payload);
      message.success('Đăng ký thành công!');
      navigate('/auth/signin');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Row style={{ minHeight: isMobile ? 'auto' : '100vh', overflow: 'hidden' }}>
      <Col xs={24} lg={24}>
        <Flex
          vertical
          align={'center'}
          justify="center"
          gap="middle"
          style={{
            height: '100%',
            padding: '2rem',
            maxWidth: 700,
            margin: 'auto',
          }}
        >
          <div>
            <Title className="m-0">Tạo tài khoản</Title>
            <Form
              name="sign-up-form"
              layout="vertical"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 24 }}
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              requiredMark={false}
            >
              <Row gutter={[8, 0]}>
                <Col xs={24} lg={12}>
                  <Form.Item<FieldType>
                    label="Họ đệm"
                    name="firstName"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập họ đệm !',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item<FieldType>
                    label="Tên của bạn"
                    name="lastName"
                    rules={[{ required: true, message: 'Vui lòng nhập tên !' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    label="Email"
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập email email !',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu !' },
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    label="Xác nhận nhật khẩu"
                    dependencies={['password']}
                    name="cPassword"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng xác nhận mật khẩu!',
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error('Xác nhận mật khẩu không trùng khớp!')
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    name="terms"
                    valuePropName="checked"
                    rules={[
                      {
                        required: true,
                        message: 'Bạn chưa đồng ý với chúng tôi!',
                      },
                    ]}
                  >
                    <Flex>
                      <Checkbox>Tôi đồng ý với</Checkbox>
                      <Link>điều khoản và chính sách.</Link>
                    </Flex>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="middle"
                  loading={loading}
                >
                  Đăng ký
                </Button>
              </Form.Item>
            </Form>
            <Divider className="m-0">hoặc</Divider>
            <Flex gap={4}>
              <Text>Bạn đã có tài khoản?</Text>
              <Link href={PATH_AUTH.signin}>Đăng nhập ngay</Link>
            </Flex>
          </div>
        </Flex>
      </Col>
    </Row>
  );
};
