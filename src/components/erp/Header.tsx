import { Home, Users, Gauge, ClipboardList, LayoutGrid, Box, ShoppingBag, LogOut, User, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top accent line */}
      <div className="h-[3px] bg-[#262f55]" />
      {/* Top strip with blue background */}
      <div className="bg-[#262f55] text-right px-3 py-1.5 text-[11px] tracking-wide">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo - left */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img alt="Hádron Portal" className="w-[60px] h-[60px] object-contain -mt-2" src={logoImg} />
          <span className="text-base font-medium tracking-wide">Hádron Portal</span>
        </div>

        {/* User - right */}
        <div className="flex items-center gap-3 border-l border-primary-foreground/20 pl-6">
          <User size={20} className="opacity-70" />
          <span className="text-sm opacity-80 hidden md:inline">3-SUPERVISOR REGIAO 1</span>
          <button
            onClick={() => navigate('/login')}
            title="Sair"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-[hsl(var(--erp-header))] border-t border-primary-foreground/10 px-6 py-2 flex items-center -mt-1">
        {/* Left button */}
        <button
          onClick={() => navigate('/catalogo')}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Box size={16} />
          Catálogo
        </button>

        {/* Center nav links */}
        <nav className="flex-1 flex items-center justify-center gap-6">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => path !== '#' && navigate(path)}
              className="text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors flex items-center gap-1.5"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right button */}
        <button
          onClick={() => navigate('/pedidos/criar')}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ClipboardList size={16} />
          Criar Pedido
        </button>
      </div>
    </header>
  );
};

export default Header;
