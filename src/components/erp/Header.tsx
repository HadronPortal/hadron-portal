import { Home, Users, Gauge, LayoutGrid, Grid3X3, Box } from 'lucide-react';
import logoImg from '@/assets/icon_hadronweb.png';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: Users, label: 'Usuários' },
  { icon: Gauge, label: 'Indicadores' },
  { icon: LayoutGrid, label: 'Grid' },
  { icon: Grid3X3, label: 'Aplicações' },
  { icon: Box, label: 'Módulos' },
];

const Header = () => {
  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top strip */}
      <div className="text-right px-4 py-1 text-[11px] opacity-70 tracking-wide">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Hádron Portal" className="w-20 h-20 object-contain" />
          <span className="text-lg font-medium tracking-wide">Hádron Portal</span>
        </div>

        <nav className="flex items-center gap-4">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="p-1.5 hover:opacity-80 transition-opacity"
            >
              <Icon size={20} />
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
