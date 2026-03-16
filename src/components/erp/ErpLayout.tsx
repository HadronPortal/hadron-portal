import { Outlet } from 'react-router-dom';
import Header from './Header';
import ScrollToTop from '@/components/ScrollToTop';
import { useLocation } from 'react-router-dom';

const ErpLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isHome ? (
        <>
          {/* Header overlays the hero on home page */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 z-30">
              <Header />
            </div>
          </div>
          <Outlet />
        </>
      ) : (
        <>
          <div className="bg-[hsl(var(--erp-banner))]">
            <Header />
          </div>
          <Outlet />
        </>
      )}
    </div>
  );
};

export default ErpLayout;
