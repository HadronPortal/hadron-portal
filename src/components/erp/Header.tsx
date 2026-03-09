import { Home, Users, BarChart3, LayoutGrid, AppWindow, Box } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: Users, label: 'Usuários' },
  { icon: BarChart3, label: 'Indicadores' },
  { icon: LayoutGrid, label: 'Grid' },
  { icon: AppWindow, label: 'Aplicações' },
  { icon: Box, label: 'Módulos' },
];

const Header = () => {
  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-sm">
            H
          </div>
          <span className="text-lg font-semibold tracking-tight hidden sm:inline">
            Hádron Portal
          </span>
        </div>

        {/* Nav Icons */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="p-2 rounded-md hover:bg-primary/20 transition-colors"
            >
              <Icon size={18} />
            </button>
          ))}
        </nav>

        {/* Company info */}
        <div className="hidden md:block text-xs text-right opacity-80 leading-tight">
          <span className="font-medium">DEV|00</span>
          <br />
          PROCION TESTE DEV WEB LTDA
        </div>
      </div>
    </header>
  );
};

export default Header;
