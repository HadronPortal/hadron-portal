import { useState, useEffect } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard, ChevronDown } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

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
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [clients, setClients] = useState<ClienteAPI[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-clients', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: null,
        });

        // Build URL manually for GET with query params
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-clients?page=${page}&limit=${rowsPerPage}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
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
    fetchClients();
  }, [page, rowsPerPage]);

  const filtered = activeTab === 'todos'
    ? clients
    : activeTab === 'positivados'
      ? clients.filter(c => (c.TOTAL_VENDAS ?? 0) > 0)
      : clients.filter(c => {
          const d = new Date(c.ter_dta_cad);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return d >= sixMonthsAgo;
        });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>

        {/* Tabs */}
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

        {/* Controls row */}
        <div className="flex items-center justify-between">
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
              {totalRecords} clientes
            </span>
          </div>

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

        {/* Table */}
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
                    <TableHead className="text-xs font-bold text-foreground">COD</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DESCRIÇÃO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DOCUMENTO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">LOCAL</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">VENDAS</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">ULT PEDIDO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">CADASTRO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">AÇÃO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.ter_codter} className="hover:bg-accent/30">
                        <TableCell className="text-sm whitespace-nowrap">{c.ter_codter}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold underline cursor-pointer">{c.ter_nomter}</span>
                          {c.ter_fanter && (
                            <div className="text-xs text-muted-foreground">{c.ter_fanter}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{formatDoc(c.ter_documento)}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{c.TEN_CIDLGR} - {c.TEN_UF_LGR}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatCurrency(c.TOTAL_VENDAS)} ({c.QUANT_VENDAS ?? 0})
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {c.ULT_VENDA ? formatDate(c.ULT_VENDA) : '—'}
                          {c.ULT_CODORC && (
                            <div className="text-xs text-muted-foreground">ORC.{c.ULT_CODORC}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{formatDate(c.ter_dta_cad)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button className="text-muted-foreground hover:text-foreground" title="Ver">
                              <Eye size={16} />
                            </button>
                            <button className="text-muted-foreground hover:text-foreground" title="Pedidos">
                              <CreditCard size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalRecords > rowsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {Math.ceil(totalRecords / rowsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(totalRecords / rowsPerPage)}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Clientes;
