import { createHashRouter, useLocation, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import publicRouter from './publicRoutes/index.tsx';
import privateRouter from './privateRoutes/index.tsx';
import { RequireAuth } from './privateRoutes/authRoute.tsx';
import { PublicOnlyRoute } from './publicRoutes/authRoute.tsx';

// Custom scroll restoration function
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/dashboards') {
    <Navigate to="/" replace />;
  }
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    }); // Scroll to the top when the location changes
  }, [pathname]);

  return null; // This component doesn't render anything
};

// Create the router

const router = createHashRouter([
  {
    path: '/',
    element: <RequireAuth />, // Bọc private route
    children: privateRouter,
  },
  {
    path: '/auth',
    element: <PublicOnlyRoute />, // Bọc public route
    children: publicRouter,
  },
]);

export default router;
