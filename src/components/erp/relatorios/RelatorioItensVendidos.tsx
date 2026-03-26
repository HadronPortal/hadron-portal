import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ScrollToTop from '@/components/ScrollToTop';
import { exportPDF, exportCSV, fetchAllForExport } from '@/lib/export-utils';
import { toast } from 'sonner';
import type { SharedFilterProps } from './RelatorioClientes';

const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=`;

interface ItemReportAPI {
  ITEM_ID: number;
  ITEM_DESCRIPTION: string;
  PRODUCT_IMAGE: string;
  ITEM_QUANTITY: number;
  UNIT_OF_MEASURE: string;
  ITEM_TOTAL_VALUE: number;
  CLIENT_NAME: string;
  ORDER_DATE: string;
  SELLER_NAME: string | null;
  QUOTE_ID: number;
  PRODUCT_PRICE: number;
}

const RelatorioItensVendidos = ({ filters }: { filters: SharedFilterProps }) => {
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [localSearchInput, setLocalSearchInput] = useState('');

  const repParam = filters.selectedRepRaw.length > 0 ? filters.selectedRepRaw.join(',') : undefined;

  const { data, isLoading, isFetching, error: queryError } = useApiFetch<any>({
    queryKey: ['report-itens-vendidos', String(page), String(rowsPerPage), repParam || 'all', toApiDate(filters.selectedPeriod.startDate), toApiDate(filters.selectedPeriod.endDate), filters.searchQuery.trim(), String(filters.filterNonce)],
    endpoint: 'fetch-item-reports',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      date_ini: toApiDate(filters.selectedPeriod.startDate),
      date_end: toApiDate(filters.selectedPeriod.endDate),
      ...(repParam ? { rep: repParam } : {}),
      ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
    },
    staleTime: 2 * 60 * 1000,
  });

  const error = queryError ? (queryError as Error).message : null;
  const items: ItemReportAPI[] = data?.reports || [];
  const totalRecords: number = data?.total_records || items.length;

  const searchTerm = filters.searchInput || localSearchInput;
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(p =>
      (p.ITEM_DESCRIPTION || '').toLowerCase().includes(q) ||
      String(p.ITEM_ID).includes(q) ||
      (p.CLIENT_NAME || '').toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, p) => {
      const qtde = p.ITEM_QUANTITY || 0;
      const valor = p.ITEM_TOTAL_VALUE || 0;
      return { qtde: acc.qtde + qtde, valor: acc.valor + valor };
    }, { qtde: 0, valor: 0 });
  }, [filtered]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const itemColumns = [
    { header: 'Item', accessor: (p: ItemReportAPI) => p.ITEM_DESCRIPTION || '' },
    { header: 'Cliente', accessor: (p: ItemReportAPI) => p.CLIENT_NAME || '' },
    { header: 'Data', accessor: (p: ItemReportAPI) => p.ORDER_DATE ? new Date(p.ORDER_DATE).toLocaleDateString('pt-BR') : '' },
    { header: 'Qtde', accessor: (p: ItemReportAPI) => String(p.ITEM_QUANTITY || 0), align: 'right' as const },
    { header: 'Preço Un.', accessor: (p: ItemReportAPI) => formatCurrency(p.PRODUCT_PRICE || 0), align: 'right' as const },
    { header: 'Total', accessor: (p: ItemReportAPI) => formatCurrency(p.ITEM_TOTAL_VALUE || 0), align: 'right' as const },
  ];

  /*
  const handleExport = useCallback(async (fmt: 'pdf' | 'csv') => {
    try {
      toast.info('Exportando itens vendidos...');
      const allData = await fetchAllForExport('fetch-item-reports', {
        date_ini: toApiDate(filters.selectedPeriod.startDate),
        date_end: toApiDate(filters.selectedPeriod.endDate),
        ...(repParam ? { rep: repParam } : {}),
        ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
      }, 'reports');
      const opts = { title: 'Relatório de Itens Vendidos', columns: itemColumns, data: allData, fileName: 'relatorio-itens-vendidos' };
      fmt === 'pdf' ? exportPDF(opts) : exportCSV(opts);
      toast.success(`${allData.length} registros exportados!`);
    } catch (e) {
      toast.error('Erro ao exportar: ' + (e as Error).message);
    }
  }, [filters.selectedPeriod, repParam, filters.searchQuery]);
  */

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
      {!isLoading && !error && (
        <div className="px-5 sm:px-6 pb-2">
           <div className="flex justify-between items-center">
             <span className="text-xs text-muted-foreground">{totalRecords} resultado{totalRecords !== 1 ? 's' : ''} total no servidor</span>
           </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-16 px-6">
          <div className="text-destructive text-sm font-medium mb-2">⚠️ Erro ao carregar relatório</div>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            {error.includes('500') || error.includes('timeout') || error.includes('Timeout')
              ? 'O servidor demorou demais para responder. Tente reduzir o período de datas no filtro para obter resultados mais rápidos.'
              : error}
          </p>
        </div>
      ) : isLoading ? (
        <div className="px-2 sm:px-6 py-4">
          <SkeletonTable columns={6} rows={10} headers={['ITEM', 'CLIENTE', 'DATA', 'QTDE', 'PREÇO UN.', 'TOTAL']} />
        </div>
      ) : (
        <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qtde</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Preço Un.</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum item encontrado
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((p, idx) => {
                      const fileName = p.PRODUCT_IMAGE ? p.PRODUCT_IMAGE.split('/').pop() || '' : '';
                      const imgUrl = fileName ? `${PROXY_BASE}${encodeURIComponent(fileName)}` : '';
                      const qtde = p.ITEM_QUANTITY || 0;
                      const precoUn = p.PRODUCT_PRICE || 0;
                      const total = p.ITEM_TOTAL_VALUE || 0;
                      return (
                        <tr key={`${p.QUOTE_ID}-${p.ITEM_ID}-${idx}`} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                          <td className="px-5 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              {imgUrl && (
                                <img
                                  src={imgUrl}
                                  alt={p.ITEM_DESCRIPTION}
                                  className="w-10 h-10 object-contain rounded bg-muted flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <span className="font-medium text-foreground">{p.ITEM_DESCRIPTION}</span>
                                <div className="text-xs text-muted-foreground">ID: #{p.ITEM_ID} | Pedido: #{p.QUOTE_ID}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate" title={p.CLIENT_NAME}>{p.CLIENT_NAME}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{p.ORDER_DATE ? new Date(p.ORDER_DATE).toLocaleDateString('pt-BR') : ''}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{qtde} {p.UNIT_OF_MEASURE}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(precoUn)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-foreground">{formatCurrency(total)}</td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr className="border-t-2 border-border bg-muted/50">
                      <td colSpan={3} className="px-5 py-3 text-sm font-bold text-foreground">TOTAL DA PÁGINA</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{totals.qtde}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground"></td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{formatCurrency(totals.valor)}</td>
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

export default RelatorioItensVendidos;
