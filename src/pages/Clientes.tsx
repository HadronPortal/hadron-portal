import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { useRepresentantes } from '@/hooks/use-representantes';
import ColumnToggle, { type ColumnDef } from '@/components/erp/ColumnToggle';
import { fetchWithAuth } from '@/lib/auth-refresh';

const COLUMNS: ColumnDef[] = [
  { key: 'cod', label: 'COD' },
  { key: 'descricao', label: 'DESCRICAO' },
  { key: 'documento', label: 'DOCUMENTO' },
  { key: 'local', label: 'LOCAL' },
  { key: 'representante', label: 'REPRESENTANTE' },
  { key: 'vendas', label: 'VENDAS' },
  { key: 'ult_pedido', label: 'ULT PEDIDO' },
  { key: 'cadastro', label: 'CADASTRO' },
  { key: 'acao', label: 'AÇÃO' },
];

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
  ULT_CODORC: number | null;
  ter_dta_cad: string;
  COD_REP: number;
}

interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'novos', label: 'Novos' },
  { key: 'positivados', label: 'Positivados' },
] as const;

const formatDoc = (doc: string) => {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

const formatCurrency = (v: number | null) => {
  if (v == null || v === 0) return 'R$0,00';
  return 'R$' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Clientes = () => {
  const navigate = useNavigate();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [clients, setClients] = useState<ClienteAPI[]>([]);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(COLUMNS.map(c => [c.key, true]))
  );
  const show = (key: string) => visibleCols[key] !== false;

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/fetch-clients?page=${page}&limit=1000`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Falha ao buscar clientes');
      const result = await res.json();
      setClients(result.clients || []);
      setTotalRecords(result.total_records || 0);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page]);

  const handleRepChange = (_repCodes: number[]) => {
    // State is set via handleFilter which is called automatically
  };
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => {
    setDateRange({ start: filters.startDate, end: filters.endDate });
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSearchQuery('');
    setDateRange(null);
  };

  const repFiltered = selectedRep.length > 0
    ? clients.filter(c => selectedRep.includes(c.COD_REP))
    : clients;

  const searchFiltered = searchQuery.trim()
    ? repFiltered.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          c.ter_nomter?.toLowerCase().includes(q) ||
          c.ter_fanter?.toLowerCase().includes(q) ||
          c.ter_documento?.includes(q) ||
          c.TEN_CIDLGR?.toLowerCase().includes(q) ||
          c.TEN_UF_LGR?.toLowerCase().includes(q)
        );
      })
    : repFiltered;

  const dateFiltered = dateRange
    ? searchFiltered.filter(c => {
        const d = c.ULT_VENDA ? new Date(c.ULT_VENDA) : c.ter_dta_cad ? new Date(c.ter_dta_cad) : null;
        if (!d) return false;
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      })
    : searchFiltered;

  const filtered = activeTab === 'todos'
    ? dateFiltered
    : activeTab === 'positivados'
      ? dateFiltered.filter(c => (c.TOTAL_VENDAS ?? 0) > 0)
      : dateFiltered.filter(c => {
          const d = new Date(c.ter_dta_cad);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return d >= sixMonthsAgo;
        });

  const visibleCount = COLUMNS.filter(col => show(col.key)).length;

  const clientCountByRep = clients.reduce<Record<number, number>>((acc, c) => {
    acc[c.COD_REP] = (acc[c.COD_REP] || 0) + 1;
    return acc;
  }, {});

  return (
    <>

      <FilterBar representantes={representantes} clientCountByRep={clientCountByRep} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Clientes</h1>

        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-erp-navy text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
            <span className="text-sm text-muted-foreground">
              {filtered.length} clientes
            </span>
          </div>

          <ColumnToggle columns={COLUMNS} visible={visibleCols} onChange={setVisibleCols} />
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {show('cod') && <TableHead className="text-xs font-bold text-foreground">COD</TableHead>}
                    {show('descricao') && <TableHead className="text-xs font-bold text-foreground">DESCRIÇÃO</TableHead>}
                    {show('documento') && <TableHead className="text-xs font-bold text-foreground">DOCUMENTO</TableHead>}
                    {show('local') && <TableHead className="text-xs font-bold text-foreground">LOCAL</TableHead>}
                    {show('representante') && <TableHead className="text-xs font-bold text-foreground">REPRESENTANTE</TableHead>}
                    {show('vendas') && <TableHead className="text-xs font-bold text-foreground">VENDAS</TableHead>}
                    {show('ult_pedido') && <TableHead className="text-xs font-bold text-foreground">ULT PEDIDO</TableHead>}
                    {show('cadastro') && <TableHead className="text-xs font-bold text-foreground">CADASTRO</TableHead>}
                    {show('acao') && <TableHead className="text-xs font-bold text-foreground">AÇÃO</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleCount} className="text-center text-muted-foreground py-6">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.ter_codter} className="hover:bg-accent/30">
                        {show('cod') && <TableCell className="text-sm whitespace-nowrap">{c.ter_codter}</TableCell>}
                        {show('descricao') && (
                          <TableCell className="text-sm">
                            <span className="font-semibold underline cursor-pointer">{c.ter_nomter}</span>
                            {c.ter_fanter && <div className="text-xs text-muted-foreground">{c.ter_fanter}</div>}
                          </TableCell>
                        )}
                        {show('documento') && <TableCell className="text-sm whitespace-nowrap">{formatDoc(c.ter_documento)}</TableCell>}
                        {show('local') && <TableCell className="text-sm whitespace-nowrap">{c.TEN_CIDLGR} - {c.TEN_UF_LGR}</TableCell>}
                        {show('representante') && (
                          <TableCell className="text-sm whitespace-nowrap">
                            {representantes.find(r => r.rep_codrep === c.COD_REP)?.rep_nomrep || c.COD_REP}
                          </TableCell>
                        )}
                        {show('vendas') && (
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatCurrency(c.TOTAL_VENDAS)} ({c.QUANT_VENDAS ?? 0})
                          </TableCell>
                        )}
                        {show('ult_pedido') && (
                          <TableCell className="text-sm whitespace-nowrap">
                            {c.ULT_VENDA ? formatDate(c.ULT_VENDA) : '—'}
                            {c.ULT_CODORC && <div className="text-xs text-muted-foreground">ORC.{c.ULT_CODORC}</div>}
                          </TableCell>
                        )}
                        {show('cadastro') && <TableCell className="text-sm whitespace-nowrap">{formatDate(c.ter_dta_cad)}</TableCell>}
                        {show('acao') && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                className="text-muted-foreground hover:text-foreground"
                                title="Ver Pedidos"
                                onClick={() => navigate(`/pedidos?codter=${c.ter_codter}&nome=${encodeURIComponent(c.ter_nomter)}`)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-foreground"
                                title="Cobranças"
                                onClick={() => navigate(`/cobrancas?codter=${c.ter_codter}&nome=${encodeURIComponent(c.ter_nomter)}`)}
                              >
                                <CreditCard size={16} />
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
      </main>
    </>
  );
};

export default Clientes;
