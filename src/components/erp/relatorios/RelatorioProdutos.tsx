import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ReportToolbar from './ReportToolbar';
import ScrollToTop from '@/components/ScrollToTop';
import { exportPDF, exportCSV, fetchAllForExport } from '@/lib/export-utils';
import { toast } from 'sonner';

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=`;

interface ProductAPI {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  pro_peso_liq: number;
  pro_unidade: string;
  pro_gtin: string;
  pro_codint: string;
  QUANT: string;
  TOTAL_VENDIDO: string;
  MEDIA: string;
  QUANT_VENDA: string;
  ORC_ORIORC?: string;
}

const RelatorioProdutos = () => {
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
    queryKey: ['report-products', String(page), String(rowsPerPage), repParam || 'all', toApiDate(selectedPeriod.startDate), toApiDate(selectedPeriod.endDate), searchQuery.trim(), String(filterNonce)],
    endpoint: 'fetch-products',
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
  const products: ProductAPI[] = data?.products || [];
  const totalRecords: number = data?.total_records || products.length;

  const tabFiltered = useMemo(() => {
    if (activeTab === 'todos') return products;
    return products.filter(p => p.ORC_ORIORC === activeTab);
  }, [products, activeTab]);

  const filtered = useMemo(() => {
    if (!searchInput.trim()) return tabFiltered;
    const q = searchInput.toLowerCase();
    return tabFiltered.filter(p =>
      (p.pro_despro || '').toLowerCase().includes(q) ||
      String(p.pro_codpro).includes(q)
    );
  }, [tabFiltered, searchInput]);

  // Totals
  const totals = useMemo(() => {
    return filtered.reduce((acc, p) => {
      const qtde = parseFloat(p.QUANT || '0');
      const valor = parseFloat(p.TOTAL_VENDIDO || '0');
      const peso = qtde * (p.pro_peso_liq || 0);
      return { qtde: acc.qtde + qtde, valor: acc.valor + valor, peso: acc.peso + peso };
    }, { qtde: 0, valor: 0, peso: 0 });
  }, [filtered]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const handleSearch = () => { setSearchQuery(searchInput); setPage(1); setFilterNonce(n => n + 1); };

  const productColumns = [
    { header: 'Código', accessor: (p: ProductAPI) => String(p.pro_codpro) },
    { header: 'Produto', accessor: (p: ProductAPI) => p.pro_despro || '' },
    { header: 'Qtde', accessor: (p: ProductAPI) => p.QUANT || '0', align: 'right' as const },
    { header: 'Peso', accessor: (p: ProductAPI) => (parseFloat(p.QUANT || '0') * (p.pro_peso_liq || 0)).toFixed(1) + ' Kg', align: 'right' as const },
    { header: 'Total Vendido', accessor: (p: ProductAPI) => formatCurrency(parseFloat(p.TOTAL_VENDIDO || '0')), align: 'right' as const },
    { header: 'Média', accessor: (p: ProductAPI) => formatCurrency(parseFloat(p.MEDIA || '0')), align: 'right' as const },
  ];

  const handleExport = useCallback(async (fmt: 'pdf' | 'csv') => {
    try {
      toast.info('Exportando todos os produtos...');
      const allData = await fetchAllForExport('fetch-products', {
        date_ini: toApiDate(selectedPeriod.startDate),
        date_end: toApiDate(selectedPeriod.endDate),
        ...(repParam ? { rep: repParam } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      }, 'products');
      const opts = { title: 'Relatório de Produtos', columns: productColumns, data: allData, fileName: 'relatorio-produtos' };
      fmt === 'pdf' ? exportPDF(opts) : exportCSV(opts);
      toast.success(`${allData.length} registros exportados!`);
    } catch (e) {
      toast.error('Erro ao exportar: ' + (e as Error).message);
    }
  }, [selectedPeriod, repParam, searchQuery]);

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
        searchPlaceholder="Buscar produto..."
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
          <SkeletonTable columns={6} rows={10} headers={['PRODUTO', 'QTDE', 'PESO', 'TOTAL', 'MÉDIA', 'QTD VENDAS']} />
        </div>
      ) : (
        <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qtde</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Peso</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Vendido</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Média</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qtd. Vendas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((p, idx) => {
                      const fileName = p.pro_foto ? p.pro_foto.split('/').pop() || '' : '';
                      const imgUrl = fileName ? `${PROXY_BASE}${encodeURIComponent(fileName)}` : '';
                      const qtde = parseFloat(p.QUANT || '0');
                      const totalVendido = parseFloat(p.TOTAL_VENDIDO || '0');
                      const media = parseFloat(p.MEDIA || '0');
                      const peso = qtde * (p.pro_peso_liq || 0);
                      return (
                        <tr key={p.pro_codpro} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                          <td className="px-5 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              {imgUrl && (
                                <img
                                  src={imgUrl}
                                  alt={p.pro_despro}
                                  className="w-10 h-10 object-contain rounded bg-muted flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <span className="font-medium text-foreground">{p.pro_despro}</span>
                                <div className="text-xs text-muted-foreground">#{p.pro_codpro}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{qtde}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{peso.toFixed(1)} {p.pro_unidade || 'Kg'}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(totalVendido)}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{formatCurrency(media)}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{p.QUANT_VENDA || 0}</td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="border-t-2 border-border bg-muted/50">
                      <td className="px-5 py-3 text-sm font-bold text-foreground">TOTAL</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{totals.qtde}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{totals.peso.toFixed(1)} Kg</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{formatCurrency(totals.valor)}</td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">—</td>
                    </tr>
                  </>
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

export default RelatorioProdutos;
