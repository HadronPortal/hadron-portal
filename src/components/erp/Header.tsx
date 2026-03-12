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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('hadron_token');
    localStorage.removeItem('hadron_user');
    navigate('/login');
  };

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
    { id: 2, name: 'Procion Sistemas' },
  ];
  const [selectedCompany, setSelectedCompany] = useState(companies[0]);

  return (
    <>
      <header className="text-primary-foreground">
        {/* Top row: Logo + Avatar */}
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16 h-[70px] max-w-[1600px] mx-auto w-full">
          <div className="flex items-center cursor-pointer flex-shrink-0 -ml-10 sm:-ml-14 lg:-ml-16" onClick={() => navigate('/')}>
            <img alt="Hádron" className="h-14 object-contain" src={logoImg} />
          </div>

          <div className="flex items-center gap-3">
            {/* Hamburger button - visible on mobile */}
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-primary-foreground/10 transition-colors"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} />
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
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                    >
                      <User size={16} className="text-muted-foreground" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={() => setUserMenuOpen(false)}
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
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-[70px] border-b border-border flex-shrink-0">
          <div className="flex items-center cursor-pointer -ml-2" onClick={() => { navigate('/'); setDrawerOpen(false); }}>
            <img alt="Hádron" className="h-40 object-contain" src={logoImg} />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
            <img src={avatarImg} alt={userName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => { navigate(path); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Company selector in drawer */}
        <div className="border-t border-border px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-4 mb-2">Empresa</p>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCompany(c)}
              className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm transition-colors ${
                selectedCompany.id === c.id ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Building2 size={14} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-destructive hover:bg-accent transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;
