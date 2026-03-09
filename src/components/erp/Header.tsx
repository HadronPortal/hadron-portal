import { Home, Users, Gauge, LayoutGrid, Grid3X3, Box, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/icon_hadronweb.png';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: Gauge, label: 'Analítico', path: '/analitico' },
  { icon: LayoutGrid, label: 'Pedidos', path: '/pedidos' },
  { icon: Grid3X3, label: 'Produtos', path: '/produtos' },
  { icon: Box, label: 'Catálogo', path: '/catalogo' },
];

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top accent line */}
      <div className="h-[3px] bg-[#262f55]" />
      {/* Top strip with blue background */}
      <div className="bg-[#262f55] text-right px-3 py-1.5 text-[11px] tracking-wide">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-20 py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img alt="Hádron Portal" className="w-[60px] h-[60px] object-contain -mt-2" src={logoImg} />
          <span className="text-base font-medium tracking-wide">Hádron Portal</span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4">
            {navItems.map(({ icon: Icon, label, path }) => (
              <button
                key={label}
                title={label}
                onClick={() => path !== '#' && navigate(path)}
                className="p-1.5 hover:opacity-80 transition-opacity"
              >
                <Icon size={20} />
              </button>
            ))}
          </nav>

          <button
            onClick={() => navigate('/login')}
            title="Sair"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border-l border-primary-foreground/20 pl-6 hover:bg-primary-foreground/10 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
