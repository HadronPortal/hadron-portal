import { useState, useMemo, lazy, Suspense } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Download, Filter, CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { useRepresentantes } from '@/hooks/use-representantes';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiFetch } from '@/hooks/use-api-fetch';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

interface Period {
  chave: string;
  legenda: string;
  total_peso: number;
  total_valor: number;
}

interface ProductAnalytics {
  codpro: number;
  produto: string;
  foto: string;
  gtin: string;
  peso_un: number;
  tipo_op_banco: string;
  mensal: Record<string, { qtde: number; valor: number }>;
  totais: { qtde: number; valor: number };
}

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'VN', label: 'Vendas' },
  { key: 'BN', label: 'Bonificação' },
  { key: 'AG', label: 'Amostra Grátis' },
] as const;

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatWeight = (v: number) =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' Kg';

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);

const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const getImageUrl = (foto: string) => {
  const filename = foto.includes('/') ? foto.split('/').pop()! : foto;
  return `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;
};

const reportTabs = [
  { key: 'produtos', label: 'Produtos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'pedidos', label: 'Pedidos' },
] as const;

type ReportTab = typeof reportTabs[number]['key'];

const Analitico = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const { representantes } = useRepresentantes();
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [selectedRepRaw, setSelectedRepRaw] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<{ startDate: Date; endDate: Date }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filterNonce, setFilterNonce] = useState(0);
  const [reportTab, setReportTab] = useState<ReportTab>('produtos');

  const repParam = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const { data, isLoading, isFetching, error: queryError } = useApiFetch<any>({
    queryKey: ['analytics', String(page), String(rowsPerPage), repParam || 'all', dateIniParam, dateEndParam, searchQuery.trim(), String(filterNonce)],
    endpoint: 'fetch-analytics',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: dateIniParam,
      date_end: dateEndParam,
      ...(repParam ? { rep: repParam } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    },
    staleTime: 0,
  });

  const error = queryError ? (queryError as Error).message : null;
  const products: ProductAnalytics[] = data?.products || [];
  const periods: Period[] = (data?.periods || []).filter((p: Period) => p.chave !== 'TOTAL');
  const totalRecords: number = data?.total_records || 0;

  const tabFiltered = activeTab === 'todos'
    ? products
    : products.filter((p) => p.tipo_op_banco === activeTab);

  const filtered = useMemo(() => {
    if (!searchInput.trim()) return tabFiltered;
    const q = searchInput.toLowerCase();
    return tabFiltered.filter(p => (p.produto || '').toLowerCase().includes(q));
  }, [tabFiltered, searchInput]);

  const totalPeriod = periods;
  const grandTotal = products.reduce((acc, p) => ({
    valor: acc.valor + (p.totais?.valor || 0),
    qtde: acc.qtde + (p.totais?.qtde || 0),
    peso: acc.peso + (p.totais?.qtde || 0) * (p.peso_un || 0),
  }), { valor: 0, qtde: 0, peso: 0 });

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
    setFilterNonce(n => n + 1);
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
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Relatórios</h1>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/60 mt-1">
              <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">Home</button>
              <span>›</span>
              <span className="text-primary-foreground/80">Relatórios</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
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

      {/* Main content - card overlapping banner */}
      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-card border border-border rounded-xl shadow-sm">

          {/* Report-level tabs */}
          <div className="flex items-center gap-1 px-5 sm:px-6 pt-5 sm:pt-6 pb-0 border-b border-border overflow-x-auto">
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReportTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  reportTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Produtos report content */}
          {reportTab === 'produtos' && (
          <>
          {/* Toolbar */}
          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search + Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar produto..."
                    className="pl-9 h-10 bg-transparent border-border"
                  />
                </div>

                {/* Filter Button */}
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 h-10 text-xs font-medium shrink-0">
                      <Filter size={14} />
                      Filtrar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[340px] p-4 space-y-4" align="start">
                    <h4 className="text-sm font-semibold text-foreground">Filtros</h4>

                    {/* Representante */}
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

                    {/* Date range */}
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
                            <Calendar
                              mode="single"
                              selected={selectedPeriod.startDate}
                              onSelect={(d) => d && setSelectedPeriod(prev => ({ ...prev, startDate: d }))}
                              locale={ptBR}
                              className={cn("p-3 pointer-events-auto")}
                            />
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
                            <Calendar
                              mode="single"
                              selected={selectedPeriod.endDate}
                              onSelect={(d) => d && setSelectedPeriod(prev => ({ ...prev, endDate: d }))}
                              locale={ptBR}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => {
                        setSearchQuery(searchInput);
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
                      onClick={() => setActiveTab(tab.key)}
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
                  className="appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-transparent text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                {/* Export */}
                <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-medium">
                  <Download size={14} />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Active filters indicator */}
            {(selectedRepRaw.length > 0 || searchQuery.trim()) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                {selectedRepRaw.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
                    Rep: {representantes.find((r: any) => String(r.rep_codrep) === selectedRepRaw[0])?.rep_nomrep || selectedRepRaw[0]}
                    <X size={12} className="cursor-pointer hover:text-destructive" onClick={() => { setSelectedRep([]); setSelectedRepRaw([]); setPage(1); setFilterNonce(n => n + 1); }} />
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
                    Busca: {searchQuery}
                    <X size={12} className="cursor-pointer hover:text-destructive" onClick={() => { setSearchQuery(''); setSearchInput(''); setPage(1); setFilterNonce(n => n + 1); }} />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          {error ? (
            <div className="text-center py-16 text-destructive text-sm">{error}</div>
          ) : isLoading ? (
            <div className="px-2 sm:px-6 py-4">
              <SkeletonTable columns={5} rows={10} headers={['PRODUTO', 'MÊS 1', 'MÊS 2', 'MÊS 3', 'TOTAL']} />
            </div>
          ) : (
            <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-b border-border">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                      {totalPeriod.map((p) => (
                        <th key={p.chave} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {p.legenda}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={totalPeriod.length + 2} className="text-center text-muted-foreground py-12 text-sm">
                          Nenhum produto encontrado
                        </td>
                      </tr>
                    ) : (
                      filtered.map((produto, idx) => {
                        const imgUrl = produto.foto ? getImageUrl(produto.foto) : '';
                        return (
                          <tr key={produto.codpro} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                            <td className="px-5 py-3 text-sm">
                              <div className="flex items-center gap-3">
                                {imgUrl && (
                                  <img
                                    src={imgUrl}
                                    alt={produto.produto}
                                    className="w-10 h-10 object-contain rounded bg-muted flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                                <div>
                                  <span className="font-medium text-foreground">{produto.produto}</span>
                                  <div className="text-xs text-muted-foreground">#{produto.codpro}</div>
                                </div>
                              </div>
                            </td>
                            {totalPeriod.map((p) => {
                              const m = produto.mensal?.[p.chave];
                              return (
                                <td key={p.chave} className="px-4 py-3 text-sm">
                                  {m ? (
                                    <>
                                      <div className="text-foreground">{formatCurrency(m.valor)}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {m.qtde} un · {formatWeight(m.qtde * (produto.peso_un || 0))}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="font-semibold text-foreground">
                                {formatCurrency(produto.totais?.valor || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {produto.totais?.qtde || 0} un · {formatWeight((produto.totais?.qtde || 0) * (produto.peso_un || 0))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* Totals row */}
                    {filtered.length > 0 && (
                      <tr className="border-t-2 border-border bg-muted/50">
                        <td className="px-5 py-3 text-sm font-bold text-foreground">TOTAL</td>
                        {totalPeriod.map((p) => (
                          <td key={p.chave} className="px-4 py-3 text-sm">
                            <div className="font-bold text-foreground">{formatCurrency(p.total_valor)}</div>
                            <div className="text-xs font-semibold text-muted-foreground">{formatWeight(p.total_peso)}</div>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="font-bold text-foreground">{formatCurrency(grandTotal.valor)}</div>
                          <div className="text-xs font-semibold text-muted-foreground">{formatWeight(grandTotal.peso)}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalRecords > rowsPerPage && (
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-t border-border">
              <span className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * rowsPerPage + 1} a {Math.min(page * rowsPerPage, totalRecords)} de {totalRecords}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                  ‹
                </Button>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(p as number)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                  ›
                </Button>
              </div>
            </div>
          )}
          </>
          )}

          {/* Clientes report */}
          {reportTab === 'clientes' && (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
              <span className="text-4xl mb-3">👥</span>
              <h3 className="text-lg font-semibold text-foreground mb-1">Relatório de Clientes</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Relatório detalhado de clientes por período, região e representante. Em breve disponível.
              </p>
            </div>
          )}

          {/* Pedidos report */}
          {reportTab === 'pedidos' && (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
              <span className="text-4xl mb-3">🛒</span>
              <h3 className="text-lg font-semibold text-foreground mb-1">Relatório de Pedidos</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Relatório detalhado de pedidos com filtros por status, período e representante. Em breve disponível.
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
};

export default Analitico;
