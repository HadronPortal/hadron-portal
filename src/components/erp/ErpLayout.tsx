import { Outlet } from 'react-router-dom';
import Header from './Header';

const ErpLayout = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <Outlet />
  </div>
);

export default ErpLayout;
