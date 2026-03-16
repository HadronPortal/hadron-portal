import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ReportToolbar from './ReportToolbar';
import ScrollToTop from '@/components/ScrollToTop';
import { exportPDF, exportCSV } from '@/lib/export-utils';

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatCurrency = (v: number | null) => {
  if (v == null || v === 0) return 'R$ 0,00';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

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
  ter_dta_cad: string;
  COD_REP: number;
}

const RelatorioClientes = () => {
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
    queryKey: ['report-clients', String(page), String(rowsPerPage), repParam || 'all', toApiDate(selectedPeriod.startDate), toApiDate(selectedPeriod.endDate), searchQuery.trim(), String(filterNonce)],
    endpoint: 'fetch-clients',
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
  const clients: ClienteAPI[] = data?.clients || data?.data || [];
  const totalRecords: number = data?.total_records || clients.length;

  // Tab filter
  const tabFiltered = useMemo(() => {
    if (activeTab === 'todos') return clients;
    // No operation type filter for clients - tabs not applicable
    return clients;
  }, [clients, activeTab]);

  const filtered = useMemo(() => {
    if (!searchInput.trim()) return tabFiltered;
    const q = searchInput.toLowerCase();
    return tabFiltered.filter(c =>
      (c.ter_nomter || '').toLowerCase().includes(q) ||
      (c.ter_fanter || '').toLowerCase().includes(q) ||
      (c.ter_documento || '').includes(q)
    );
  }, [tabFiltered, searchInput]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const handleSearch = () => { setSearchQuery(searchInput); setPage(1); setFilterNonce(n => n + 1); };

  const clientColumns = [
    { header: 'Cliente', accessor: (c: ClienteAPI) => c.ter_nomter || '' },
    { header: 'Fantasia', accessor: (c: ClienteAPI) => c.ter_fanter || '' },
    { header: 'Documento', accessor: (c: ClienteAPI) => c.ter_documento || '' },
    { header: 'Cidade', accessor: (c: ClienteAPI) => c.TEN_CIDLGR || '' },
    { header: 'UF', accessor: (c: ClienteAPI) => c.TEN_UF_LGR || '' },
    { header: 'Total Vendas', accessor: (c: ClienteAPI) => formatCurrency(c.TOTAL_VENDAS), align: 'right' as const },
    { header: 'Qtd. Vendas', accessor: (c: ClienteAPI) => String(c.QUANT_VENDAS || 0), align: 'right' as const },
    { header: 'Últ. Venda', accessor: (c: ClienteAPI) => formatDate(c.ULT_VENDA), align: 'right' as const },
  ];

  const handleExport = useCallback((fmt: 'pdf' | 'csv') => {
    const opts = { title: 'Relatório de Clientes', columns: clientColumns, data: filtered, fileName: 'relatorio-clientes' };
    fmt === 'pdf' ? exportPDF(opts) : exportCSV(opts);
  }, [filtered]);

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

  return (
    <>
      <ReportToolbar
        searchPlaceholder="Buscar cliente..."
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
        onExport={handleExport}
      />

      {error ? (
        <div className="text-center py-16 text-destructive text-sm">{error}</div>
      ) : isLoading ? (
        <div className="px-2 sm:px-6 py-4">
          <SkeletonTable columns={5} rows={10} headers={['CLIENTE', 'DOCUMENTO', 'LOCALIZAÇÃO', 'VENDAS', 'ÚLT. VENDA']} />
        </div>
      ) : (
        <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Vendas</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qtd. Vendas</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Últ. Venda</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((cli, idx) => (
                    <tr key={cli.ter_codter} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="px-5 py-3 text-sm">
                        <div>
                          <span className="text-foreground">{cli.ter_nomter}</span>
                          {cli.ter_fanter && <div className="text-xs text-muted-foreground">{cli.ter_fanter}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{cli.ter_documento}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{cli.TEN_CIDLGR} - {cli.TEN_UF_LGR}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(cli.TOTAL_VENDAS)}</td>
                      <td className="px-4 py-3 text-sm text-right text-foreground">{cli.QUANT_VENDAS || 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatDate(cli.ULT_VENDA)}</td>
                    </tr>
                  ))
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

export default RelatorioClientes;
