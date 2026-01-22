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
import {
  FacebookFilled,
  GoogleOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_DASHBOARD } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const { Title, Text, Link } = Typography;

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export const SignInPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    console.log('Success:', values);
    setLoading(true);

    message.open({
      type: 'success',
      content: 'Login successful',
    });

    setTimeout(() => {
      navigate(PATH_DASHBOARD.statistic);
    }, 2000);
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
          style={{ height: '100%', padding: '2rem' }}
        >
          <div style={{ margin: '0 15px' }}>
            <Title className="m-0">Đăng nhập</Title>
            <Form
              name="sign-up-form"
              layout="vertical"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              initialValues={{
                email: 'demo@email.com',
                password: 'demo123',
                remember: true,
              }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              requiredMark={false}
            >
              <Row gutter={[8, 0]}>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please input your email' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item<FieldType>
                    label="Password"
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your password!',
                      },
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Flex align="center" justify="space-between">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="middle"
                    loading={loading}
                    onClick={() => localStorage.setItem('token', '123')}
                  >
                    Đăng nhập
                  </Button>
                  <Link href={PATH_AUTH.passwordReset}>Quên mật khẩu?</Link>
                </Flex>
              </Form.Item>
            </Form>
            <Divider className="m-0">hoặc</Divider>
            <Flex gap={4}>
              <Text>Bạn chưa có tài khoản?</Text>
              <Link href={PATH_AUTH.signup}>Đăng ký ngay</Link>
            </Flex>
          </div>
        </Flex>
      </Col>
    </Row>
  );
};
