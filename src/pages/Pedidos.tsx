import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

import { useApiFetch } from '@/hooks/use-api-fetch';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, FileText, Plus, Search, Send, CheckCircle, XCircle } from 'lucide-react';
import SkeletonKpiRow from '@/components/erp/skeletons/SkeletonKpiRow';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
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

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDoc = (doc: string) => {
  const d = (doc || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  '10': { label: 'Digitação', color: '#eab308', bg: '#eab30818' },
  '20': { label: 'Enviado', color: '#06b6d4', bg: '#06b6d418' },
  '30': { label: 'Aprovado', color: '#f59e0b', bg: '#f59e0b18' },
  '40': { label: 'Faturado', color: '#10b981', bg: '#10b98118' },
  '50': { label: 'Faturado', color: '#10b981', bg: '#10b98118' },
  '90': { label: 'Cancelado', color: '#ef4444', bg: '#ef444418' },
  'EN': { label: 'Enviado', color: '#06b6d4', bg: '#06b6d418' },
  'AP': { label: 'Aprovado', color: '#f59e0b', bg: '#f59e0b18' },
  'FA': { label: 'Faturado', color: '#10b981', bg: '#10b98118' },
  'CA': { label: 'Cancelado', color: '#ef4444', bg: '#ef444418' },
  'PC': { label: 'Pag. Confirmado', color: '#22c55e', bg: '#22c55e18' },
  'PE': { label: 'Pendente', color: '#eab308', bg: '#eab30818' },
};

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const TABLE_HEADERS = ['CÓDIGO', 'CLIENTE', 'DOCUMENTO', 'LOCALIZAÇÃO', 'STATUS', 'VALOR', 'PESO(KG)', 'DATA', 'AÇÕES'];

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Analítico', path: '/analitico' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Pedidos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const codter = searchParams.get('codter');
  const clienteNome = searchParams.get('nome');

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNonce, setFilterNonce] = useState(0);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : undefined;
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const { data, isLoading, isFetching, error } = useApiFetch<OrdersAPIResponse>({
    queryKey: ['orders', repParam || 'all', dateIniParam, dateEndParam, String(page), String(rowsPerPage), codter || '', String(filterNonce)],
    endpoint: 'fetch-orders',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: dateIniParam,
      date_end: dateEndParam,
      ...(repParam ? { rep: repParam } : {}),
      ...(codter ? { codter } : {}),
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
    <>
      {/* Hero banner - same pattern as Dashboard */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="absolute inset-x-0 top-0 h-[70px] bg-[hsl(var(--erp-banner))]" />
        <div className="h-[70px]" />
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

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-4 sm:space-y-5 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        {clienteNome && (
          <div className="text-sm text-primary-foreground/80">
            Filtro Cliente:{' '}
            <button onClick={clearClientFilter} className="text-primary-foreground underline font-semibold">
              {decodeURIComponent(clienteNome)}
            </button>
            <button onClick={clearClientFilter} className="ml-2 text-xs text-primary-foreground/60 hover:text-primary-foreground">✕</button>
          </div>
        )}

        {/* KPI Summary Card - Inspired by uploaded image */}
        {showSkeleton ? (
          <SkeletonKpiRow count={4} />
        ) : (
          <FadeIn>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
                {kpiItems.map(({ label, value, peso, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center justify-between px-5 sm:px-7 py-5 sm:py-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground/60">{peso}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {error ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-destructive text-sm">{(error as Error).message}</p>
          </div>
        ) : (
          <>
            {/* Search & controls card */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar pedido..."
                    className="pl-9 h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 text-xs sm:text-sm h-10 bg-muted/50 border-border hover:bg-[#DBEAFE] hover:text-[#3B82F6] hover:border-[#93C5FD] focus-visible:ring-0"
                    onClick={() => navigate('/pedidos/criar')}
                  >
                    <Plus size={16} /> <span className="hidden sm:inline">Criar</span> Pedido
                  </Button>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    className="appearance-none border border-border rounded-md pl-3 pr-7 py-1.5 text-sm bg-card text-foreground h-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{totalRecords} registros</span>
                </div>
              </div>
            </div>

            {/* Table */}
            {showSkeleton ? (
              <SkeletonTable columns={8} rows={10} headers={TABLE_HEADERS} />
            ) : (
              <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {TABLE_HEADERS.map(h => (
                            <TableHead key={h} className={`text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${h === 'AÇÕES' ? 'text-right' : ''}`}>{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              Nenhum pedido encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredOrders.map((o, idx) => {
                            const code = o.orc_codorc_web || '';
                            const st = statusMap[String(o.orc_status)] || { label: String(o.orc_status || '—'), color: '#8b8b8b', bg: '#8b8b8b18' };
                            return (
                              <TableRow key={`${code}-${idx}`} className="hover:bg-accent/30 cursor-pointer border-b border-border/50" onClick={() => navigate(`/pedidos/${o.orc_codorc_web}`)}>
                                <TableCell className="text-sm font-semibold text-primary">
                                  #{code}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="text-foreground">{o.CLIENTE || ''}</div>
                                  {o.FANTER && (
                                    <div className="text-xs text-muted-foreground">{o.FANTER}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-foreground whitespace-nowrap">{formatDoc(o.orc_documento || '')}</TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {o.LOCALIZACAO || '—'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
                                    style={{ backgroundColor: st.bg, color: st.color, borderColor: st.color + '40' }}
                                  >
                                    {st.label}
                                  </span>
                                  {o.orc_codorc_had > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">ERP:{o.orc_codorc_had}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{formatCurrency(o.orc_val_tot || 0)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{o.OIT_PESO || 0}</TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(o.DATA_PEDIDO || '')}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {totalRecords > rowsPerPage && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {Math.ceil(totalRecords / rowsPerPage)}
                </span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(totalRecords / rowsPerPage)} onClick={() => setPage(p => p + 1)}>
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default Pedidos;
