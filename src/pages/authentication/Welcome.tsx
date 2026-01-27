import { Flex, Typography } from 'antd';
import { Logo } from '../../components';

export const WelcomePage = () => {
  return (
    <Flex
      vertical
      gap="large"
      align="center"
      justify="center"
      style={{ height: '80vh' }}
    >
      <Logo color="blue" />
      <Typography.Title className="m-0">Welcome to Antd</Typography.Title>
      <Typography.Text style={{ fontSize: 18 }}>
        A dynamic and versatile multipurpose dashboard utilizing Ant Design,
        React, TypeScript, and Vite.
      </Typography.Text>
    </Flex>
  );
};
