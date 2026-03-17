import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ScrollToTop from '@/components/ScrollToTop';
import { exportPDF, exportCSV, exportXLSX, fetchAllForExport } from '@/lib/export-utils';
import { toast } from 'sonner';

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

export interface SelectedClient {
  code: number;
  name: string;
}

export interface SharedFilterProps {
  selectedRepRaw: string[];
  selectedPeriod: { startDate: Date; endDate: Date };
  searchQuery: string;
  searchInput: string;
  representantes: any[];
  filterNonce: number;
  selectedClients: SelectedClient[];
}

interface Props {
  filters: SharedFilterProps;
  onSelectClients?: (clients: SelectedClient[]) => void;
}

const RelatorioClientes = ({ filters, onSelectClients }: Props) => {
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const [localSearchInput, setLocalSearchInput] = useState('');

  const repParam = filters.selectedRepRaw.length > 0 ? filters.selectedRepRaw.join(',') : undefined;

  const { data, isLoading, isFetching, error: queryError } = useApiFetch<any>({
    queryKey: ['report-clients', String(page), String(rowsPerPage), repParam || 'all', toApiDate(filters.selectedPeriod.startDate), toApiDate(filters.selectedPeriod.endDate), filters.searchQuery.trim(), String(filters.filterNonce)],
    endpoint: 'fetch-clients',
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
  const clients: ClienteAPI[] = data?.clients || data?.data || [];
  const totalRecords: number = data?.total_records || clients.length;

  const searchTerm = filters.searchInput || localSearchInput;
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter(c =>
      (c.ter_nomter || '').toLowerCase().includes(q) ||
      (c.ter_fanter || '').toLowerCase().includes(q) ||
      (c.ter_documento || '').includes(q)
    );
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const showOverlay = isFetching && !isLoading;

  const selectedCodes = new Set(filters.selectedClients.map(c => c.code));
  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selectedCodes.has(c.ter_codter));

  const toggleClient = useCallback((cli: ClienteAPI) => {
    const current = filters.selectedClients;
    const exists = current.find(c => c.code === cli.ter_codter);
    const updated = exists
      ? current.filter(c => c.code !== cli.ter_codter)
      : [...current, { code: cli.ter_codter, name: cli.ter_nomter }];
    onSelectClients?.(updated);
  }, [filters.selectedClients, onSelectClients]);

  const toggleAll = useCallback(() => {
    if (allVisibleSelected) {
      // Deselect all visible
      const visibleCodes = new Set(filtered.map(c => c.ter_codter));
      const updated = filters.selectedClients.filter(c => !visibleCodes.has(c.code));
      onSelectClients?.(updated);
    } else {
      // Select all visible (merge with existing)
      const current = new Map(filters.selectedClients.map(c => [c.code, c]));
      filtered.forEach(c => {
        if (!current.has(c.ter_codter)) {
          current.set(c.ter_codter, { code: c.ter_codter, name: c.ter_nomter });
        }
      });
      onSelectClients?.(Array.from(current.values()));
    }
  }, [allVisibleSelected, filtered, filters.selectedClients, onSelectClients]);

  const clientColumns = [
    { header: 'Cliente', accessor: (c: ClienteAPI) => c.ter_nomter || '' },
    { header: 'Fantasia', accessor: (c: ClienteAPI) => c.ter_fanter || '' },
    { header: 'Documento', accessor: (c: ClienteAPI) => c.ter_documento || '', forceText: true },
    { header: 'Cidade', accessor: (c: ClienteAPI) => c.TEN_CIDLGR || '' },
    { header: 'UF', accessor: (c: ClienteAPI) => c.TEN_UF_LGR || '' },
    { header: 'Total Vendas', accessor: (c: ClienteAPI) => formatCurrency(c.TOTAL_VENDAS), align: 'right' as const },
    { header: 'Qtd. Vendas', accessor: (c: ClienteAPI) => String(c.QUANT_VENDAS || 0), align: 'right' as const },
    { header: 'Últ. Venda', accessor: (c: ClienteAPI) => formatDate(c.ULT_VENDA), align: 'right' as const },
  ];

  const handleExport = useCallback(async (fmt: 'pdf' | 'csv') => {
    try {
      toast.info('Exportando todos os registros...');
      const allData = await fetchAllForExport('fetch-clients', {
        date_ini: toApiDate(filters.selectedPeriod.startDate),
        date_end: toApiDate(filters.selectedPeriod.endDate),
        ...(repParam ? { rep: repParam } : {}),
        ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
      }, 'clients');
      const opts = { title: 'Relatório de Clientes', columns: clientColumns, data: allData, fileName: 'relatorio-clientes' };
      fmt === 'pdf' ? exportPDF(opts) : exportCSV(opts);
      toast.success(`${allData.length} registros exportados!`);
    } catch (e) {
      toast.error('Erro ao exportar: ' + (e as Error).message);
    }
  }, [filters.selectedPeriod, repParam, filters.searchQuery]);

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
      {/* Selection indicator */}
      {filters.selectedClients.length > 0 && (
        <div className="px-5 sm:px-6 py-2 bg-primary/5 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-primary">
            {filters.selectedClients.length} cliente{filters.selectedClients.length > 1 ? 's' : ''} selecionado{filters.selectedClients.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs text-muted-foreground">— os filtros das outras abas serão aplicados apenas a estes clientes</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-destructive hover:text-destructive ml-auto"
            onClick={() => onSelectClients?.([])}
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="px-5 sm:px-6 pb-2">
          <span className="text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

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
                  <th className="px-3 py-3 w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
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
                    <td colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((cli, idx) => (
                    <tr key={cli.ter_codter} className={`border-b border-border hover:bg-accent/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''} ${selectedCodes.has(cli.ter_codter) ? 'bg-primary/5' : ''}`}>
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedCodes.has(cli.ter_codter)}
                          onCheckedChange={() => toggleClient(cli)}
                          aria-label={`Selecionar ${cli.ter_nomter}`}
                        />
                      </td>
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
