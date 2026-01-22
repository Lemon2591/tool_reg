import { useLocation } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export const PageWrapper = ({ children }: { children: ReactNode }) => (
  <>
    <ScrollToTop />
    {children}
  </>
);
