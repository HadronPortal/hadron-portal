import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ReportToolbar from './ReportToolbar';

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ClientAnalytics {
  codter: number;
  cliente: string;
  cidade: string;
  uf: string;
  tipo_op_banco: string;
  mensal: Record<string, { qtde: number; valor: number }>;
  totais: { qtde: number; valor: number };
}

interface Period {
  chave: string;
  legenda: string;
  total_peso: number;
  total_valor: number;
}

const RelatorioClientes = () => {
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useState('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [selectedRepRaw, setSelectedRepRaw] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filterNonce, setFilterNonce] = useState(0);

  const repParam = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const { data, isLoading, isFetching, error: queryError } = useApiFetch<any>({
    queryKey: ['analytics-clients', String(page), String(rowsPerPage), repParam || 'all', dateIniParam, dateEndParam, searchQuery.trim(), String(filterNonce)],
    endpoint: 'fetch-analytics',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: dateIniParam,
      date_end: dateEndParam,
      group_by: 'client',
      ...(repParam ? { rep: repParam } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    },
    staleTime: 0,
  });

  const error = queryError ? (queryError as Error).message : null;
  const clients: ClientAnalytics[] = data?.clients || data?.products || [];
  const periods: Period[] = (data?.periods || []).filter((p: Period) => p.chave !== 'TOTAL');
  const totalRecords: number = data?.total_records || 0;

  const tabFiltered = activeTab === 'todos' ? clients : clients.filter((c) => c.tipo_op_banco === activeTab);
  const filtered = useMemo(() => {
    if (!searchInput.trim()) return tabFiltered;
    const q = searchInput.toLowerCase();
    return tabFiltered.filter(c => (c.cliente || '').toLowerCase().includes(q));
  }, [tabFiltered, searchInput]);

  const grandTotal = filtered.reduce((acc, c) => ({
    valor: acc.valor + (c.totais?.valor || 0),
    qtde: acc.qtde + (c.totais?.qtde || 0),
  }), { valor: 0, qtde: 0 });

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
        onRepChange={(raw, codes) => { setSelectedRepRaw(raw); setSelectedRep(codes); }}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onApplyFilters={() => { setSearchQuery(searchInput); setPage(1); setFilterNonce(n => n + 1); setShowFilters(false); }}
        onClearFilters={() => { setSelectedRep([]); setSelectedRepRaw([]); setSelectedPeriod({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE }); setSearchQuery(''); setSearchInput(''); setPage(1); setFilterNonce(n => n + 1); setShowFilters(false); }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
        searchQuery={searchQuery}
      />

      {error ? (
        <div className="text-center py-16 text-destructive text-sm">{error}</div>
      ) : isLoading ? (
        <div className="px-2 sm:px-6 py-4">
          <SkeletonTable columns={4} rows={10} headers={['CLIENTE', 'MÊS 1', 'MÊS 2', 'TOTAL']} />
        </div>
      ) : (
        <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  {periods.map((p) => (
                    <th key={p.chave} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{p.legenda}</th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={periods.length + 2} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((cli, idx) => (
                    <tr key={cli.codter} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="px-5 py-3 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{cli.cliente}</span>
                          <div className="text-xs text-muted-foreground">{cli.cidade} - {cli.uf}</div>
                        </div>
                      </td>
                      {periods.map((p) => {
                        const m = cli.mensal?.[p.chave];
                        return (
                          <td key={p.chave} className="px-4 py-3 text-sm">
                            {m ? (
                              <>
                                <div className="text-foreground">{formatCurrency(m.valor)}</div>
                                <div className="text-xs text-muted-foreground">{m.qtde} un</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="font-semibold text-foreground">{formatCurrency(cli.totais?.valor || 0)}</div>
                        <div className="text-xs text-muted-foreground">{cli.totais?.qtde || 0} un</div>
                      </td>
                    </tr>
                  ))
                )}
                {filtered.length > 0 && (
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td className="px-5 py-3 text-sm font-bold text-foreground">TOTAL</td>
                    {periods.map((p) => (
                      <td key={p.chave} className="px-4 py-3 text-sm">
                        <div className="font-bold text-foreground">{formatCurrency(p.total_valor)}</div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="font-bold text-foreground">{formatCurrency(grandTotal.valor)}</div>
                    </td>
                  </tr>
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
