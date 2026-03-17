import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import TablePagination from '@/components/erp/TablePagination';
import ScrollToTop from '@/components/ScrollToTop';

import type { SharedFilterProps } from './RelatorioClientes';

const formatCurrency = (v: string | number | null) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (n == null || isNaN(n) || n === 0) return 'R$ 0,00';
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

interface RepReport {
  id: number;
  nome: string;
  status: number;
  tot_clientes: string;
  novos_clientes: string;
  vendas: string;
  tot_vendido: string;
  ult_venda: string | null;
  positivados: string;
}

interface ApiResponse {
  success: boolean;
  total_records: number;
  reports: RepReport[];
  page: number;
  limit: number;
}

interface Props {
  filters: SharedFilterProps;
}

const RelatorioRepresentantes = ({ filters }: Props) => {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const repParam = filters.selectedRepRaw.length > 0 ? filters.selectedRepRaw.join(',') : undefined;
  const searchQ = filters.searchQuery?.trim() || undefined;

  const { data, isLoading } = useApiFetch<ApiResponse>({
    queryKey: ['rep-reports', String(page), String(rowsPerPage), repParam || '', searchQ || '', String(filters.filterNonce)],
    endpoint: 'fetch-rep-reports',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      rep: repParam,
      search: searchQ,
    },
    staleTime: 2 * 60 * 1000,
  });

  const reports = data?.reports || [];
  const totalRecords = data?.total_records || 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  // Local text search fallback
  const filtered = useMemo(() => {
    const q = (filters.searchInput || '').trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(r =>
      r.nome.toLowerCase().includes(q) || String(r.id).includes(q)
    );
  }, [reports, filters.searchInput]);

  const headers = ['Cód', 'Representante', 'Status', 'Clientes', 'Novos', 'Vendas', 'Total Vendido', 'Positivados', 'Últ. Venda'];

  if (isLoading) {
    return (
      <div className="px-2 sm:px-6 py-4">
        <SkeletonTable columns={headers.length} rows={8} headers={headers} />
      </div>
    );
  }

  return (
    <>
      <div className="px-5 sm:px-6 pb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filtered.length} representante{filtered.length !== 1 ? 's' : ''}
          {totalRecords > filtered.length && ` de ${totalRecords}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Cód</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Representante</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24 text-center">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24 text-right">Clientes</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24 text-right">Novos</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24 text-right">Vendas</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32 text-right">Total Vendido</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28 text-right">Positivados</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28 text-right">Últ. Venda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12 text-sm">
                  Nenhum representante encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rep) => (
                <TableRow key={rep.id} className="hover:bg-accent/30 transition-colors border-b border-border/50">
                  <TableCell className="text-sm font-mono text-muted-foreground">{rep.id}</TableCell>
                  <TableCell className="text-sm text-foreground font-medium">{rep.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={rep.status === 1 ? 'default' : 'secondary'} className={`text-[10px] ${rep.status === 1 ? 'bg-erp-green text-white border-transparent hover:bg-erp-green/80' : ''}`}>
                      {rep.status === 1 ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{rep.tot_clientes}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{rep.novos_clientes}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums font-medium">{rep.vendas}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums font-medium text-primary">{formatCurrency(rep.tot_vendido)}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{rep.positivados}</TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">{formatDate(rep.ult_venda)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-4 sm:px-6 py-3">
        <TablePagination
          page={page}
          totalRecords={totalRecords}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
        />
      </div>

      <ScrollToTop />
    </>
  );
};

export default RelatorioRepresentantes;
