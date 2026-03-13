import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Eye, ChevronLeft, ChevronRight, ChevronDown, FileText, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import { useRepresentantes } from '@/hooks/use-representantes';
import { fetchWithAuth } from '@/lib/auth-refresh';


interface ClienteAPI {
  ter_codter: number;
  ter_nomter: string;
  ter_fanter: string;
  ter_documento: string;
  TEN_CIDLGR: string;
  TEN_UF_LGR: string;
  TOTAL_VENDAS: number | null;
  QUANT_VENDAS: number | null;
  ULT_VENDA: string | null;
  ULT_CODORC: number | null;
  ter_dta_cad: string;
  COD_REP: number;
}

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'positivados', label: 'Positivados' },
  { key: 'novos', label: 'Novos' },
] as const;

const formatDoc = (doc: string) => {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

const formatCurrency = (v: number | null) => {
  if (v == null || v === 0) return 'R$ 0,00';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Analítico', path: '/analitico' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [clients, setClients] = useState<ClienteAPI[]>([]);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterNonce, setFilterNonce] = useState(0);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const params = new URLSearchParams({
        page: String(page),
        limit: String(rowsPerPage),
        date_ini: dateIniParam,
        date_end: dateEndParam,
      });
      if (repParam) params.set('rep', repParam);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const url = `https://${projectId}.supabase.co/functions/v1/fetch-clients?${params.toString()}`;
      const res = await fetchWithAuth(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Falha ao buscar clientes');
      const result = await res.json();
      setClients(result.clients || []);
      setTotalRecords(result.total_records || 0);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage, repParam, dateIniParam, dateEndParam, searchQuery, filterNonce]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => {
    setSelectedPeriod({ startDate: filters.startDate, endDate: filters.endDate });
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
    setSearchInput(filters.search);
    setPage(1);
    setFilterNonce((n) => n + 1);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSelectedPeriod({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
    setSearchQuery('');
    setSearchInput('');
    setPage(1);
    setFilterNonce((n) => n + 1);
  };

  const filtered = useMemo(() => {
    if (activeTab === 'todos') return clients;
    if (activeTab === 'positivados') return clients.filter(c => (c.TOTAL_VENDAS ?? 0) > 0);
    // novos
    return clients.filter(c => {
      const d = new Date(c.ter_dta_cad);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return d >= sixMonthsAgo;
    });
  }, [clients, activeTab]);

  const clientCountByRep = clients.reduce<Record<number, number>>((acc, c) => {
    acc[c.COD_REP] = (acc[c.COD_REP] || 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.ter_codter)));
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Hero banner - same as Dashboard */}
      <div className="relative overflow-hidden bg-black">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Clientes</h1>
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
                      : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">

        {/* Main Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          {/* Toolbar */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar clientes..."
                className="pl-9 h-10 bg-background border-border"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tabs */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); }}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === tab.key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Rows per page */}
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-background text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Selected bar */}
          {selectedIds.size > 0 && (
            <div className="px-5 sm:px-6 pb-3 flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{selectedIds.size} selecionado(s)</span>
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                Limpar Seleção
              </Button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="px-2 sm:px-6 py-4">
              <SkeletonTable columns={8} rows={10} headers={['Cliente', 'Documento', 'Local', 'Status', 'Vendas', 'Cadastro', 'Ações']} />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-destructive text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-border">
                    <th className="w-12 px-5 py-3">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Local</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vendas</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted-foreground py-16 text-sm">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const isPositivado = (c.TOTAL_VENDAS ?? 0) > 0;
                      return (
                        <tr
                          key={c.ter_codter}
                          className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="w-12 px-5 py-3.5">
                            <Checkbox
                              checked={selectedIds.has(c.ter_codter)}
                              onCheckedChange={() => toggleSelect(c.ter_codter)}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="text-sm font-normal text-foreground hover:text-primary cursor-pointer transition-colors">
                                {c.ter_nomter}
                              </span>
                              {c.ter_fanter && (
                                <p className="text-xs text-muted-foreground mt-0.5">{c.ter_fanter}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDoc(c.ter_documento)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {c.TEN_CIDLGR} - {c.TEN_UF_LGR}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium border-0 px-2.5 py-0.5 ${
                                isPositivado
                                  ? 'bg-[hsl(var(--erp-green)/0.12)] text-[hsl(var(--erp-green))]'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {isPositivado ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-sm font-medium text-foreground">{formatCurrency(c.TOTAL_VENDAS)}</span>
                            <span className="text-xs text-muted-foreground ml-1.5">({c.QUANT_VENDAS ?? 0})</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(c.ter_dta_cad)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-4 text-xs font-normal gap-1.5 rounded-md border border-border bg-card text-muted-foreground transition-all duration-150 hover:bg-[#DBEAFE] hover:text-[#3B82F6] hover:border-[#93C5FD] data-[state=open]:bg-[#DBEAFE] data-[state=open]:text-[#3B82F6] data-[state=open]:border-[#93C5FD] focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                  style={{ fontFamily: "'Poppins', sans-serif" }}
                                >
                                  Actions
                                  <ChevronDown size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => navigate(`/clientes/${c.ter_codter}`, { state: { client: c } })}>
                                  Visualizar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground hidden sm:block">
                Mostrando {Math.min((page - 1) * rowsPerPage + 1, totalRecords)} a {Math.min(page * rowsPerPage, totalRecords)} de {totalRecords}
              </p>
              <div className="flex items-center gap-1 mx-auto sm:mx-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                        page === p
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Clientes;
