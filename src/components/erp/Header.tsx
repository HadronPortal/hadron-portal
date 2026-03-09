import { Home, Users, UserCheck, LayoutGrid, Grid3X3, Store } from 'lucide-react';
import logoImg from '@/assets/icon_hadronweb.png';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: Users, label: 'Usuários' },
  { icon: UserCheck, label: 'Indicadores' },
  { icon: LayoutGrid, label: 'Grid' },
  { icon: Grid3X3, label: 'Aplicações' },
  { icon: Store, label: 'Módulos' },
];

const Header = () => {
  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top strip */}
      <div className="text-right px-4 py-1 text-[11px] opacity-70 tracking-wide">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-lg font-bold">H</span>
          </div>
          <span className="text-base font-medium tracking-wide">Hádron Portal</span>
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
