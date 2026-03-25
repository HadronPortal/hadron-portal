import { useState, useCallback, useMemo } from 'react';
import FilterPanel from '@/components/erp/FilterPanel';
import PeriodPicker from '@/components/erp/PeriodPicker';
import { type SelectedClient } from '@/components/erp/FilterClientPicker';
import { useSessionState } from '@/hooks/use-session-state';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useApiFetch } from '@/hooks/use-api-fetch';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, FileText, Plus, Search, Send, CheckCircle, XCircle, Filter, X, CalendarIcon, Sun, Moon, ShoppingCart, Eye } from 'lucide-react';
import SkeletonKpiRow from '@/components/erp/skeletons/SkeletonKpiRow';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import TablePagination from '@/components/erp/TablePagination';
import FadeIn from '@/components/erp/skeletons/FadeIn';

interface OrderAPI {
  orc_codorc_web: number;
  orc_codorc_had: number;
  CODTER: number;
  CLIENTE: string;
  FANTER?: string;
  orc_documento: string;
  LOCALIZACAO: string;
  orc_status: number | string;
  orc_val_tot: number;
  OIT_PESO: string;
  DATA_PEDIDO: string;
  orc_id_pedido?: string;
  REPRESENTANTE?: string;
  [key: string]: unknown;
}

interface OrdersAPIResponse {
  orders: OrderAPI[];
  dashboard: {
    sent: number;
    sent_peso: number;
    approved: number;
    approved_peso: number;
    invoiced: number;
    invoiced_peso: number;
    canceled: number;
    canceled_peso: number;
  };
  total_records: number;
}

const formatCurrency = (v: number | string | null) => {
  if (v == null || v === '' || v === 0 || v === '0') return 'R$ 0,00';
  const num = typeof v === 'string' ? parseFloat(v as string) : v;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  '10': { label: 'ABERTO', color: '#eab308', bg: '#eab30818' },
  '20': { label: 'ENVIADO', color: '#06b6d4', bg: '#06b6d418' },
  '30': { label: 'APROVADO', color: '#f59e0b', bg: '#f59e0b18' },
  '40': { label: 'FATURADO', color: '#10b981', bg: '#10b98118' },
  '50': { label: 'FATURADO', color: '#10b981', bg: '#10b98118' },
  '90': { label: 'CANCELADO', color: '#ef4444', bg: '#ef444418' },
  'EN': { label: 'ENVIADO', color: '#06b6d4', bg: '#06b6d418' },
  'AP': { label: 'APROVADO', color: '#f59e0b', bg: '#f59e0b18' },
  'FA': { label: 'FATURADO', color: '#10b981', bg: '#10b98118' },
  'CA': { label: 'CANCELADO', color: '#ef4444', bg: '#ef444418' },
  'PC': { label: 'PAG. CONFIRMADO', color: '#22c55e', bg: '#22c55e18' },
  'PE': { label: 'PENDENTE', color: '#eab308', bg: '#eab30818' },
};

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const TABLE_HEADERS = ['Nº PEDIDO', 'CLIENTE', 'DATA', 'VALOR', 'STATUS', 'AÇÕES'];

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Pedidos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { representantes } = useRepresentantes();

  const codter = searchParams.get('codter');
  const clienteNome = searchParams.get('nome');

  const [rowsPerPage, setRowsPerPage] = useSessionState('pedidos_rowsPerPage', 50);
  const [page, setPage] = useState(1);
  const [selectedRep, setSelectedRep] = useSessionState<number[]>('global_rep', []);
  const [selectedRepRaw, setSelectedRepRaw] = useSessionState<string[]>('global_repRaw', []);
  const [selectedPeriodRaw, setSelectedPeriod] = useSessionState('global_period', { startDate: DEFAULT_START_DATE.toISOString(), endDate: DEFAULT_END_DATE.toISOString() });
  const [searchQuery, setSearchQuery] = useSessionState('pedidos_search', '');
  const [filterNonce, setFilterNonce] = useState(0);
  const [selectedClients, setSelectedClients] = useSessionState<SelectedClient[]>('global_clients', []);

  const selectedPeriod = { startDate: new Date(selectedPeriodRaw.startDate), endDate: new Date(selectedPeriodRaw.endDate) };
  const hasActiveFilters = selectedRepRaw.length > 0 || searchQuery.trim() !== '' || selectedClients.length > 0 || selectedPeriodRaw.startDate !== DEFAULT_START_DATE.toISOString() || selectedPeriodRaw.endDate !== DEFAULT_END_DATE.toISOString();
  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : undefined;
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const effectiveCodter = codter || (selectedClients.length > 0 ? selectedClients.map(c => c.code).join(',') : '');
  const effectiveRepParam = effectiveCodter ? undefined : repParam;

  const { data, isLoading, isFetching, error } = useApiFetch<OrdersAPIResponse>({
    queryKey: ['orders', effectiveRepParam || 'all', dateIniParam, dateEndParam, String(page), String(rowsPerPage), effectiveCodter, String(filterNonce)],
    endpoint: 'fetch-orders',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: dateIniParam,
      date_end: dateEndParam,
      ...(effectiveRepParam ? { rep: effectiveRepParam } : {}),
      ...(effectiveCodter ? { codter: effectiveCodter } : {}),
    },
    staleTime: 0,
  });

  const orders = data?.orders || [];
  const dashboard = data?.dashboard || { sent: 0, sent_peso: 0, approved: 0, approved_peso: 0, invoiced: 0, invoiced_peso: 0, canceled: 0, canceled_peso: 0 };
  const totalRecords = data?.total_records || 0;

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(o =>
      (o.CLIENTE || '').toLowerCase().includes(q) ||
      (o.FANTER || '').toLowerCase().includes(q) ||
      (o.orc_documento || '').includes(q) ||
      (o.LOCALIZACAO || '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const clearClientFilter = () => {
    searchParams.delete('codter');
    searchParams.delete('nome');
    setSearchParams(searchParams);
  };

  const kpiItems = [
    { label: 'Enviados', value: formatCurrency(dashboard.sent), peso: `${dashboard.sent_peso} Kg`, icon: Send, color: 'hsl(var(--erp-blue))', bg: 'hsl(var(--erp-blue) / 0.15)' },
    { label: 'Aprovados', value: formatCurrency(dashboard.approved), peso: `${dashboard.approved_peso} Kg`, icon: CheckCircle, color: 'hsl(var(--erp-green))', bg: 'hsl(var(--erp-green) / 0.15)' },
    { label: 'Faturados', value: formatCurrency(dashboard.invoiced), peso: `${dashboard.invoiced_peso} Kg`, icon: FileText, color: 'hsl(var(--erp-navy))', bg: 'hsl(var(--erp-navy) / 0.15)' },
    { label: 'Cancelados', value: formatCurrency(dashboard.canceled), peso: `${dashboard.canceled_peso} Kg`, icon: XCircle, color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.15)' },
  ];

  const showSkeleton = isLoading;
  const showOverlay = isFetching && !isLoading;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Hero banner - same pattern as Clientes */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))] transition-colors duration-200">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Pedidos</h1>
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

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-4 sm:space-y-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        {clienteNome && (
          <div className="text-sm text-primary-foreground/80 mb-2">
            Filtro Cliente:{' '}
            <button onClick={clearClientFilter} className="text-primary-foreground underline font-semibold">
              {decodeURIComponent(clienteNome)}
            </button>
            <button onClick={clearClientFilter} className="ml-2 text-xs text-primary-foreground/60 hover:text-primary-foreground">✕</button>
          </div>
        )}

        {/* Floating Card Content Wrapper */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col gap-6 transition-colors duration-200">
          
          {/* Header Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <ShoppingCart className="text-[#FF6A00]" size={36} />
              Pedidos
            </h1>
            <p className="text-muted-foreground text-[15px]">Acompanhe e gerencie os pedidos de venda.</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 w-full mt-2 justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-[400px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pedidos..."
                className="w-full h-12 bg-card border border-border rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:border-border focus:ring-1 focus:ring-border text-foreground placeholder-muted-foreground transition-colors duration-200"
              />
            </div>

            <div className="flex gap-4 items-center flex-wrap sm:flex-nowrap">
              <div className="[&>button]:h-12 [&>button]:border-border [&>button]:bg-card [&>button:hover]:bg-accent [&>button:hover]:text-accent-foreground [&>button]:px-6 [&>button]:rounded-xl [&>button]:text-sm [&>button]:font-medium [&>button]:shadow-none transition-colors duration-200">
                <FilterPanel
                  hideClientFilter
                  representantes={representantes}
                  selectedRepRaw={selectedRepRaw}
                  setSelectedRepRaw={setSelectedRepRaw}
                  selectedRep={selectedRep}
                  setSelectedRep={setSelectedRep}
                  selectedClients={selectedClients}
                  setSelectedClients={setSelectedClients}
                  hasActiveFilters={hasActiveFilters}
                  onApply={() => { setPage(1); setFilterNonce(n => n + 1); }}
                  onClear={() => {
                    setSelectedRep([]);
                    setSelectedRepRaw([]);
                    setSelectedClients([]);
                    setSelectedPeriod({ startDate: DEFAULT_START_DATE.toISOString(), endDate: DEFAULT_END_DATE.toISOString() });
                    setPage(1);
                    setFilterNonce(n => n + 1);
                  }}
                />
              </div>

              <PeriodPicker
                startDate={selectedPeriod.startDate}
                endDate={selectedPeriod.endDate}
                onChange={(v) => {
                  setSelectedPeriod({ startDate: v.startDate.toISOString(), endDate: v.endDate.toISOString() });
                  setPage(1);
                  setFilterNonce(n => n + 1);
                }}
              />

              <Button
                className="gap-2 h-12 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white border-0 shadow-none font-medium ml-auto sm:ml-0"
                onClick={() => navigate('/pedidos/criar')}
              >
                <Plus size={16} /> <span className="hidden sm:inline">Criar Pedido</span>
              </Button>
            </div>
          </div>

          {/* Active filters indicator */}
          {selectedRepRaw.length > 0 && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
                Rep: {representantes.find((r: any) => String(r.rep_codrep) === selectedRepRaw[0])?.rep_nomrep || selectedRepRaw[0]}
                <X size={12} className="cursor-pointer hover:text-destructive" onClick={() => { setSelectedRep([]); setSelectedRepRaw([]); setPage(1); setFilterNonce(n => n + 1); }} />
              </span>
            </div>
          )}

          {error ? (
            <div className="text-center py-20 text-red-500 font-medium">{(error as Error).message}</div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden mt-2 shadow-sm transition-colors duration-200">
              {showSkeleton ? (
                <div className="p-6">
                  <SkeletonTable columns={6} rows={10} headers={TABLE_HEADERS} />
                </div>
              ) : (
                <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          {TABLE_HEADERS.map(h => (
                            <th key={h} className={`px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider ${h === 'AÇÕES' ? 'text-right' : ''}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted-foreground py-16 text-sm">
                              Nenhum pedido encontrado.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o, idx) => {
                            const code = o.orc_codorc_web || o.orc_codorc_had || '';
                            const st = statusMap[String(o.orc_status)] || { label: String(o.orc_status || '—'), color: '#8b8b8b', bg: '#8b8b8b30' };
                            return (
                              <tr key={`${code}-${idx}`} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/pedidos/${o.orc_codorc_web}`)}>
                                <td className="px-6 py-5">
                                  <div className="font-bold text-foreground text-[14px]">
                                    #{code}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="font-bold text-foreground text-[14px] max-w-xs xl:max-w-md truncate" title={o.CLIENTE}>
                                    {o.CLIENTE || '—'}
                                  </div>
                                  {o.FANTER && (
                                    <div className="text-muted-foreground text-xs mt-1 truncate max-w-[200px]" title={o.FANTER}>
                                      {o.FANTER}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-5 text-sm text-foreground/80">
                                  {formatDate(o.DATA_PEDIDO)}
                                </td>
                                <td className="px-6 py-5 font-bold text-foreground text-[14px]">
                                  {formatCurrency(o.orc_val_tot || 0)}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide"
                                       style={{ backgroundColor: st.bg, color: st.color }}>
                                    {st.label}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/pedidos/${o.orc_codorc_web}`); }}
                                    className="inline-flex items-center justify-center h-9 w-9 rounded-full text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors"
                                  >
                                    <Eye size={18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                    <TablePagination page={page} totalRecords={totalRecords} rowsPerPage={rowsPerPage} onPageChange={setPage} />
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                      className="ml-4 border border-border rounded-lg px-3 py-1.5 text-xs bg-card text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-border transition-colors duration-200"
                    >
                      <option value={10}>10 linhas</option>
                      <option value={25}>25 linhas</option>
                      <option value={50}>50 linhas</option>
                      <option value={100}>100 linhas</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pedidos;
