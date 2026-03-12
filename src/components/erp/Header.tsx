import { useState, useRef, useEffect } from 'react';
import { Home, Users, Gauge, ClipboardList, Box, LogOut, Menu, X, User, Settings, Building2, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import logoImg from '@/assets/logo_hadron_go.png';
import avatarImg from '@/assets/avatar-user.png';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyMenuOpen(false);
      }
    };
    if (userMenuOpen || companyMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen, companyMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('hadron_token');
    localStorage.removeItem('hadron_user');
    navigate('/login');
  };

  // Get user info from localStorage
  const userData = (() => {
    try {
      const raw = localStorage.getItem('hadron_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  })();
  
  const userName = userData?.nome || userData?.aus_nome || userData?.name || 'Usuário';
  const userEmail = userData?.email || userData?.aus_email || '';
  
  const companies = [
    { id: 1, name: 'Procion Tecnologia' },
    { id: 2, name: 'Aliança Artes' },
  ];
  const [selectedCompany, setSelectedCompany] = useState(companies[0]);

  return (
    <header className="text-primary-foreground">
      {/* Top row: Logo + Avatar */}
      <div className="flex items-center justify-between px-6 sm:px-10 h-[70px]">
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <img alt="Hádron" className="h-52 object-contain" src={logoImg} />
        </div>

        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="relative flex items-center gap-3" ref={menuRef}>
            <div className="hidden sm:flex items-center gap-5">
              <div className="relative" ref={companyRef}>
                <button
                  onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
                  className="flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  <Building2 size={16} />
                  <span className="text-sm leading-tight truncate max-w-[200px]">{selectedCompany.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${companyMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {companyMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="py-1">
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCompany(c); setCompanyMenuOpen(false); }}
                          className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${
                            selectedCompany.id === c.id ? 'bg-accent text-foreground font-medium' : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <Building2 size={14} className="text-muted-foreground" />
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium leading-tight truncate max-w-[180px]">{userName}</span>
            </div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-10 w-10 rounded-md overflow-hidden ring-2 ring-primary-foreground/20 cursor-pointer hover:ring-primary-foreground/40 transition-all"
            >
              <img src={avatarImg} alt={userName} className="h-full w-full object-cover" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <div className="h-11 w-11 rounded-md overflow-hidden flex-shrink-0">
                    <img src={avatarImg} alt={userName} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => { setUserMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <User size={16} className="text-muted-foreground" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <Settings size={16} className="text-muted-foreground" />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-destructive hover:bg-accent transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider line */}
      <div className="h-px bg-primary-foreground/10" />

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-primary-foreground/10 px-3 py-2 grid grid-cols-5 gap-1 bg-[hsl(var(--erp-header))]">
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
