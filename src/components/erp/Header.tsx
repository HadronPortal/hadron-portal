import { useState } from 'react';
import { Home, Users, Gauge, ClipboardList, LayoutGrid, Box, ShoppingBag, LogOut, User, DollarSign, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '@/assets/icon_hadronweb.png';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Gauge, label: 'Analítico', path: '/analitico' },
  { icon: ClipboardList, label: 'Pedidos', path: '/pedidos' },
  { icon: LayoutGrid, label: 'Produtos', path: '/produtos' },
  { icon: Box, label: 'Catálogo', path: '/catalogo' },
  { icon: DollarSign, label: 'Cobranças', path: '/cobrancas' },
  { icon: ShoppingBag, label: 'Loja Virtual', path: '/loja' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top accent line */}
      <div className="h-[3px] bg-[#262f55]" />
      {/* Top strip */}
      <div className="bg-[#262f55] text-right px-3 py-1.5 text-[11px] tracking-wide truncate">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/')}>
          <img alt="Hádron Portal" className="w-10 h-10 sm:w-[60px] sm:h-[60px] object-contain -mt-1 sm:-mt-2 flex-shrink-0" src={logoImg} />
          <span className="text-sm sm:text-base font-medium tracking-wide truncate">Hádron Portal</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-4">
            {navItems.map(({ icon: Icon, label, path }) => (
              <button
                key={label}
                title={label}
                onClick={() => navigate(path)}
                className={`p-1.5 hover:opacity-80 transition-opacity ${location.pathname === path ? 'opacity-100' : 'opacity-70'}`}
              >
                <Icon size={20} />
              </button>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3 border-l border-primary-foreground/20 pl-3 sm:pl-6">
            <User size={18} className="opacity-70 hidden sm:block" />
            <span className="text-xs sm:text-sm opacity-80 hidden md:inline truncate max-w-[200px]">3-SUPERVISOR REGIAO 1</span>
            <button
              onClick={() => {
                localStorage.removeItem('hadron_token');
                localStorage.removeItem('hadron_user');
                navigate('/login');
              }}
              title="Sair"
              className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors text-sm"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-primary-foreground/10 px-3 py-2 grid grid-cols-4 gap-1">
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
