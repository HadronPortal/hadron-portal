import { useState, useEffect, useMemo } from 'react';
import { useSessionState } from '@/hooks/use-session-state';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Eye, ChevronLeft, ChevronRight, Filter, X, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ScrollToTop from '@/components/ScrollToTop';
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
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useSessionState<string>('clientes_tab', 'todos');
  const [rowsPerPage, setRowsPerPage] = useSessionState('clientes_rowsPerPage', 50);
  const [clients, setClients] = useState<ClienteAPI[]>([]);
  const [selectedRep, setSelectedRep] = useSessionState<number[]>('clientes_rep', []);
  const [selectedPeriodRaw, setSelectedPeriodRaw] = useSessionState('clientes_period', { startDate: DEFAULT_START_DATE.toISOString(), endDate: DEFAULT_END_DATE.toISOString() });
  const [searchQuery, setSearchQuery] = useSessionState('clientes_searchQuery', '');
  const [searchInput, setSearchInput] = useSessionState('clientes_searchInput', '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterNonce, setFilterNonce] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRepRaw, setSelectedRepRaw] = useSessionState<string[]>('clientes_repRaw', []);

  const selectedPeriod = { startDate: new Date(selectedPeriodRaw.startDate), endDate: new Date(selectedPeriodRaw.endDate) };
  const setSelectedPeriod = (v: { startDate: Date | string; endDate: Date | string }) => {
    setSelectedPeriodRaw({
      startDate: v.startDate instanceof Date ? v.startDate.toISOString() : v.startDate,
      endDate: v.endDate instanceof Date ? v.endDate.toISOString() : v.endDate,
    });
  };
  const hasActiveFilters = selectedRepRaw.length > 0 || searchQuery.trim() !== '';
  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const clientFilterMap: Record<string, string> = { todos: 'all', positivados: 'positive', novos: 'new' };
        const params = new URLSearchParams({
          page: String(page),
          limit: String(rowsPerPage),
          date_ini: dateIniParam,
          date_end: dateEndParam,
          client_filter: clientFilterMap[activeTab] || 'all',
        });
        if (repParam) params.set('rep', repParam);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const url = `https://${projectId}.supabase.co/functions/v1/fetch-clients?${params.toString()}`;
        const res = await fetchWithAuth(url, { headers: { 'Content-Type': 'application/json' }, signal: abortController.signal });
        if (cancelled) return;
        if (!res.ok) throw new Error('Falha ao buscar clientes');
        const result = await res.json();
        if (cancelled) return;
        setClients(result.clients || []);
        setTotalRecords(result.total_records || 0);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClients();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [page, rowsPerPage, repParam, dateIniParam, dateEndParam, searchQuery, filterNonce, activeTab]);

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

  const filtered = clients;

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
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
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
            {/* Search + Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar clientes..."
                  className="pl-9 h-10 bg-transparent border-border"
                />
              </div>

              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-10 text-xs font-medium shrink-0">
                    <Filter size={14} />
                    Filtrar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-4 space-y-4" align="start">
                  <h4 className="text-sm font-semibold text-foreground">Filtros</h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Representante</label>
                    <select
                      value={selectedRepRaw.length === 1 ? selectedRepRaw[0] : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setSelectedRepRaw([val]);
                          setSelectedRep([Number(val)]);
                        } else {
                          setSelectedRepRaw([]);
                          setSelectedRep([]);
                        }
                      }}
                      className="w-full appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
                    >
                      <option value="">Todos</option>
                      {representantes.map((r: any) => (
                        <option key={r.rep_codrep} value={r.rep_codrep}>{r.rep_nomrep}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                            {format(selectedPeriod.startDate, 'dd/MM/yy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={selectedPeriod.startDate} onSelect={(d) => d && setSelectedPeriod({ startDate: d, endDate: selectedPeriod.endDate })} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                            {format(selectedPeriod.endDate, 'dd/MM/yy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={selectedPeriod.endDate} onSelect={(d) => d && setSelectedPeriod({ startDate: selectedPeriod.startDate, endDate: d })} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                      setPage(1);
                      setFilterNonce(n => n + 1);
                      setShowFilters(false);
                    }}>
                      Aplicar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
                      setSelectedRep([]);
                      setSelectedRepRaw([]);
                      setSelectedPeriod({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
                      setSearchQuery('');
                      setSearchInput('');
                      setPage(1);
                      setFilterNonce(n => n + 1);
                      setShowFilters(false);
                    }}>
                      Limpar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tabs */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setPage(1); }}
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
                className="appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer [&>option]:bg-card [&>option]:text-foreground"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Active filters */}
          {selectedRepRaw.length > 0 && (
            <div className="px-5 sm:px-6 pb-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
                Rep: {representantes.find((r: any) => String(r.rep_codrep) === selectedRepRaw[0])?.rep_nomrep || selectedRepRaw[0]}
                <X size={12} className="cursor-pointer hover:text-destructive" onClick={() => { setSelectedRep([]); setSelectedRepRaw([]); setPage(1); setFilterNonce(n => n + 1); }} />
              </span>
            </div>
          )}

          {/* Selected bar */}
          {selectedIds.size > 0 && (
            <div className="px-5 sm:px-6 pb-3 flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{selectedIds.size} selecionado(s)</span>
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
                     <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Local</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vendas</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground py-16 text-sm">
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
                           <td className="px-4 py-3.5 text-center">
                             <button
                               onClick={() => navigate(`/clientes/${c.ter_codter}`, { state: { client: c } })}
                               className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                               title="Visualizar"
                             >
                               <Eye size={16} />
                             </button>
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
                <ScrollToTop />
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
