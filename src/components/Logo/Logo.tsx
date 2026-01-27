import { Flex, FlexProps } from 'antd';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';

import './styles.css';

type LogoProps = {
  color: CSSProperties['color'];
  imgSize?: {
    h?: number | string;
    w?: number | string;
  };
  asLink?: boolean;
  href?: string;
  bgColor?: CSSProperties['backgroundColor'];
} & Partial<FlexProps>;

export const Logo = ({
  asLink,
  color,
  href,
  imgSize,
  bgColor,
  ...others
}: LogoProps) => {
  return (
    <Link to={href || '#'} className="logo-link">
      <Flex gap={others.gap || 'small'} align="center" {...others}>
        <div style={{ marginTop: 10 }} className="div_logo">
          <img
            src="../public/logo.png"
            alt="logo"
            style={{ width: '100%', objectFit: 'contain', height: 20 }}
          />
          <span className="bg_span_logo logo_animation"></span>
        </div>
      </Flex>
    </Link>
  );
};
