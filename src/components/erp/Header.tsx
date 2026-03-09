import { Home, Users, Gauge, LayoutGrid, Grid3X3, Box } from 'lucide-react';
import logoImg from '@/assets/icon_hadronweb.png';

const navItems = [
{ icon: Home, label: 'Home' },
{ icon: Users, label: 'Usuários' },
{ icon: Gauge, label: 'Indicadores' },
{ icon: LayoutGrid, label: 'Grid' },
{ icon: Grid3X3, label: 'Aplicações' },
{ icon: Box, label: 'Módulos' }];


const Header = () => {
  return (
    <header className="bg-[hsl(var(--erp-header))] text-primary-foreground">
      {/* Top accent line */}
      <div className="h-[3px] bg-[#262f55]" />
      {/* Top strip with blue background */}
      <div className="bg-[#262f55] text-right px-3 py-[3px] text-[11px] tracking-wide">
        DEV|00-PROCION TESTE DEV WEB LTDA
      </div>
      {/* Main header */}
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-3">
          <img alt="Hádron Portal" className="w-[60px] h-[60px] object-contain -mt-2" src={logoImg} />
          <span className="text-base font-medium tracking-wide">Hádron Portal</span>
        </div>

        <nav className="flex items-center gap-4">
          {navItems.map(({ icon: Icon, label }) =>
          <button
            key={label}
            title={label}
            className="p-1.5 hover:opacity-80 transition-opacity">
            
              <Icon size={20} />
            </button>
          )}
        </nav>
      </div>
    </header>);

};

export default Header;