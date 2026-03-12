import { useState } from 'react';
import { Home, Users, Gauge, ClipboardList, LayoutGrid, Box, ShoppingBag, LogOut, DollarSign, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '@/assets/logo_hadron_go.png';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Gauge, label: 'Analítico', path: '/analitico' },
  { icon: ClipboardList, label: 'Pedidos', path: '/pedidos' },
  { icon: Box, label: 'Catálogo', path: '/catalogo' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="text-primary-foreground">
      {/* Main header - transparent */}
      <div className="flex items-center justify-between px-6 sm:px-10 h-[70px]">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
            <img alt="Hádron" className="h-9 object-contain" src={logoImg} />
          </div>

          {/* Desktop nav - text only */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: User avatar only */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary-foreground/20 cursor-pointer">
              S
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('hadron_token');
                localStorage.removeItem('hadron_user');
                navigate('/login');
              }}
              title="Sair"
              className="p-2 rounded-md hover:bg-primary-foreground/10 transition-colors"
            >
              <LogOut size={16} className="text-primary-foreground/60" />
            </button>
          </div>
        </div>
      </div>
      {/* Divider line */}
      <div className="h-px bg-primary-foreground/10" />

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-primary-foreground/10 px-3 py-2 grid grid-cols-4 gap-1 bg-[hsl(var(--erp-header))]">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center hover:bg-primary-foreground/10 transition-colors ${location.pathname === path ? 'bg-primary-foreground/10' : ''}`}
            >
              <Icon size={18} />
              <span className="text-[10px] leading-tight">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
