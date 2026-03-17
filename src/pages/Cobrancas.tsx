import { useState } from 'react';
import { useSessionState } from '@/hooks/use-session-state';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import ScrollToTop from '@/components/ScrollToTop';

interface Charge {
  rec_id_rec: string;
  CLIENTE: string;
  CODTER: number;
  REPRESENTANTE: string;
  rec_valrec: number;
  rec_val_pend: number;
  PENDENCIA: string;
  rec_dta_ems: string;
  rec_dta_vnc: string;
}

interface ChargesAPIResponse {
  charges: Charge[];
  total_records: number;
}

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

const TABLE_HEADERS = ['DOCUMENTO', 'CLIENTE', 'REPRESENTANTE', 'VALOR', 'PENDÊNCIA', 'EMISSÃO', 'VENCIMENTO'];

const Cobrancas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { representantes } = useRepresentantes();
  const codter = searchParams.get('codter');
  const clienteNome = searchParams.get('nome');

  const [rowsPerPage, setRowsPerPage] = useSessionState('cobrancas_rowsPerPage', 50);
  const [page, setPage] = useState(1);
  const [selectedRep, setSelectedRep] = useSessionState<number[]>('cobrancas_rep', []);
  const [searchQuery, setSearchQuery] = useSessionState('cobrancas_search', '');
  const [dateIni, setDateIni] = useSessionState('cobrancas_dateIni', '');
  const [dateEnd, setDateEnd] = useSessionState('cobrancas_dateEnd', '');
  const [filterNonce, setFilterNonce] = useState(0);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';

  const { data, isLoading, isFetching } = useApiFetch<ChargesAPIResponse>({
    queryKey: ['charges', repParam, dateIni, dateEnd, String(page), String(rowsPerPage), codter || '', String(filterNonce)],
    endpoint: 'fetch-charges',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      ...(codter ? { codter } : {}),
      ...(repParam ? { rep: repParam } : {}),
      ...(dateIni ? { date_ini: dateIni } : {}),
      ...(dateEnd ? { date_end: dateEnd } : {}),
    },
    staleTime: 0,
  });

  const charges = data?.charges || [];
  const totalRecords = data?.total_records || 0;

  const clearClientFilter = () => {
    searchParams.delete('codter');
    searchParams.delete('nome');
    setSearchParams(searchParams);
  };

  const handleRepChange = () => {};
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
    setDateIni(format(filters.startDate, 'yyyy-MM-dd'));
    setDateEnd(format(filters.endDate, 'yyyy-MM-dd'));
    setPage(1);
    setFilterNonce((n) => n + 1);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSearchQuery('');
    setDateIni('');
    setDateEnd('');
    setPage(1);
    setFilterNonce((n) => n + 1);
  };

  const filteredCharges = searchQuery.trim()
    ? charges.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          (c.CLIENTE || '').toLowerCase().includes(q) ||
          (c.REPRESENTANTE || '').toLowerCase().includes(q) ||
          (c.rec_id_rec || '').includes(q)
        );
      })
    : charges;

  const isOverdue = (vnc: string) => {
    if (!vnc) return false;
    return new Date(vnc) < new Date();
  };

  const showOverlay = isFetching && !isLoading;

  return (
    <>
      <FilterBar representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      {clienteNome && (
        <div className="px-6 pt-2 text-sm text-muted-foreground">
          Filtro Cliente:{' '}
          <button onClick={clearClientFilter} className="text-primary underline font-semibold">
            {decodeURIComponent(clienteNome)}
          </button>
          <button onClick={clearClientFilter} className="ml-2 text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cobranças</h1>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
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
            <span className="text-sm text-muted-foreground">{totalRecords} registros</span>
          </div>

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

        {isLoading ? (
          <SkeletonTable columns={7} rows={10} headers={TABLE_HEADERS} />
        ) : (
          <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {TABLE_HEADERS.map(h => (
                        <TableHead key={h} className="text-xs font-bold text-foreground">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                          Nenhuma cobrança encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCharges.map((c) => (
                        <TableRow key={c.rec_id_rec} className="hover:bg-accent/30">
                          <TableCell className="text-sm font-mono whitespace-nowrap">{c.rec_id_rec}</TableCell>
                          <TableCell className="text-sm">
                            <div className="font-semibold">{c.CLIENTE}</div>
                            <div className="text-xs text-muted-foreground">Cód: {c.CODTER}</div>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{c.REPRESENTANTE}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatCurrency(c.rec_valrec)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            <span className={parseFloat(c.PENDENCIA) > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                              {formatCurrency(parseFloat(c.PENDENCIA))}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatDate(c.rec_dta_ems)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            <span className={isOverdue(c.rec_dta_vnc) ? 'text-destructive font-semibold' : ''}>
                              {formatDate(c.rec_dta_vnc)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {totalRecords > rowsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <ScrollToTop />
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
      </main>
    </>
  );
};

export default Cobrancas;
