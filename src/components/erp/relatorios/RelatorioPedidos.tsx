import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ReportToolbar from './ReportToolbar';
import ScrollToTop from '@/components/ScrollToTop';

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
};

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
  REPRESENTANTE?: string;
}

const RelatorioPedidos = () => {
  const { representantes } = useRepresentantes();
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedRepRaw, setSelectedRepRaw] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filterNonce, setFilterNonce] = useState(0);
  const [activeTab, setActiveTab] = useState('todos');

  const repParam = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;

  const { data, isLoading, isFetching, error: queryError } = useApiFetch<any>({
    queryKey: ['report-orders', String(page), String(rowsPerPage), repParam || 'all', toApiDate(selectedPeriod.startDate), toApiDate(selectedPeriod.endDate), searchQuery.trim(), String(filterNonce)],
    endpoint: 'fetch-orders',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: toApiDate(selectedPeriod.startDate),
      date_end: toApiDate(selectedPeriod.endDate),
      ...(repParam ? { rep: repParam } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    },
    staleTime: 2 * 60 * 1000,
  });

  const error = queryError ? (queryError as Error).message : null;
  const orders: OrderAPI[] = data?.orders || [];
  const totalRecords: number = data?.total_records || orders.length;
  const dashboard = data?.dashboard;

  const filtered = useMemo(() => {
    if (!searchInput.trim()) return orders;
    const q = searchInput.toLowerCase();
    return orders.filter(o =>
      (o.CLIENTE || '').toLowerCase().includes(q) ||
      String(o.orc_codorc_web).includes(q) ||
      (o.orc_documento || '').includes(q)
    );
  }, [orders, searchInput]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const handleSearch = () => { setSearchQuery(searchInput); setPage(1); setFilterNonce(n => n + 1); };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const getStatus = (s: number | string) => statusMap[String(s)] || { label: String(s), color: '#9ca3af', bg: '#9ca3af18' };

  return (
    <>
      <ReportToolbar
        searchPlaceholder="Buscar pedido..."
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        showFilters={showFilters}
        onShowFiltersChange={setShowFilters}
        representantes={representantes}
        selectedRepRaw={selectedRepRaw}
        onRepChange={(raw) => { setSelectedRepRaw(raw); }}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onApplyFilters={() => { setSearchQuery(searchInput); setPage(1); setFilterNonce(n => n + 1); setShowFilters(false); }}
        onClearFilters={() => { setSelectedRepRaw([]); setSelectedPeriod({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE }); setSearchQuery(''); setSearchInput(''); setPage(1); setFilterNonce(n => n + 1); setShowFilters(false); }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
        searchQuery={searchQuery}
        showOpTabs={false}
      />

      {/* KPI summary */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 sm:px-6 pb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Enviados</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(dashboard.sent)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Aprovados</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(dashboard.approved)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Faturados</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(dashboard.invoiced)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Cancelados</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(dashboard.canceled)}</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-16 text-destructive text-sm">{error}</div>
      ) : isLoading ? (
        <div className="px-2 sm:px-6 py-4">
          <SkeletonTable columns={6} rows={10} headers={['PEDIDO', 'CLIENTE', 'LOCALIZAÇÃO', 'STATUS', 'VALOR', 'DATA']} />
        </div>
      ) : (
        <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pedido</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((ord, idx) => {
                    const st = getStatus(ord.orc_status);
                    return (
                      <tr key={ord.orc_codorc_web} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                        <td className="px-5 py-3 text-sm">
                          <span className="font-medium text-foreground">#{ord.orc_codorc_web}</span>
                          {ord.orc_codorc_had > 0 && <div className="text-xs text-muted-foreground">ERP: {ord.orc_codorc_had}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-foreground">{ord.CLIENTE}</span>
                          <div className="text-xs text-muted-foreground">{ord.orc_documento}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{ord.LOCALIZACAO}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ color: st.color, backgroundColor: st.bg }}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(ord.orc_val_tot)}</td>
                        <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatDate(ord.DATA_PEDIDO)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalRecords > rowsPerPage && (
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-t border-border">
          <span className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * rowsPerPage + 1} a {Math.min(page * rowsPerPage, totalRecords)} de {totalRecords}
          </span>
          <div className="flex items-center gap-1">
            <ScrollToTop />
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">‹</Button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="px-1 text-muted-foreground text-xs">...</span>
              ) : (
                <Button key={p} variant={page === p ? 'default' : 'ghost'} size="sm" onClick={() => setPage(p as number)} className="h-8 w-8 p-0 text-xs">{p}</Button>
              )
            )}
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">›</Button>
          </div>
        </div>
      )}
    </>
  );
};

export default RelatorioPedidos;
