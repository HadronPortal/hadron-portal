import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText, Plus } from 'lucide-react';
import Spinner from '@/components/ui/spinner';

interface OrderAPI {
  orc_codorc: number;
  orc_codter: number;
  ter_nomter: string;
  ter_fanter?: string;
  ter_documento: string;
  TEN_CIDLGR: string;
  TEN_UF_LGR: string;
  orc_status: string;
  orc_vlrorc: number;
  orc_peso: number;
  orc_dtaorc: string;
  orc_erp?: string;
  [key: string]: unknown;
}

interface Dashboard {
  sent: number;
  sent_peso: number;
  approved: number;
  approved_peso: number;
  invoiced: number;
  invoiced_peso: number;
  canceled: number;
  canceled_peso: number;
}

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDoc = (doc: string) => {
  const d = (doc || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const statusMap: Record<string, { label: string; color: string }> = {
  'EN': { label: 'Enviado', color: 'bg-teal-600' },
  'AP': { label: 'Aprovado', color: 'bg-orange-500' },
  'FA': { label: 'Faturado', color: 'bg-cyan-500' },
  'CA': { label: 'Cancelado', color: 'bg-red-500' },
  'PC': { label: 'Pagamento Confirmado', color: 'bg-green-500' },
  'PE': { label: 'Pendente', color: 'bg-yellow-500' },
};

const Pedidos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { representantes } = useRepresentantes();
  const codter = searchParams.get('codter');
  const clienteNome = searchParams.get('nome');

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({ sent: 0, sent_peso: 0, approved: 0, approved_peso: 0, invoiced: 0, invoiced_peso: 0, canceled: 0, canceled_peso: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async (repCodes: number[] = selectedRep) => {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let url = `https://${projectId}.supabase.co/functions/v1/fetch-orders?page=${page}&limit=${rowsPerPage}`;
      if (codter) url += `&codter=${codter}`;
      if (repCodes.length > 0) url += `&rep=${repCodes.join(',')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar pedidos');
      const data = await res.json();

      setOrders(data.orders || []);
      setDashboard(data.dashboard || dashboard);
      setTotalRecords(data.total_records || 0);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, codter]);

  const clearClientFilter = () => {
    searchParams.delete('codter');
    searchParams.delete('nome');
    setSearchParams(searchParams);
  };

  const handleRepChange = (repCodes: number[]) => setSelectedRep(repCodes);
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
    setPage(1);
    fetchOrders(filters.repCodes);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSearchQuery('');
    setPage(1);
    fetchOrders([]);
  };

  // Apply search filter on loaded orders
  const filteredOrders = searchQuery.trim()
    ? orders.filter(o => {
        const q = searchQuery.toLowerCase();
        return (
          (o.ter_nomter || '').toLowerCase().includes(q) ||
          (o.ter_fanter || '').toLowerCase().includes(q) ||
          (o.ter_documento || '').includes(q) ||
          (o.TEN_CIDLGR || '').toLowerCase().includes(q)
        );
      })
    : orders;

  const kpiCards = [
    { label: 'Enviados', valor: formatCurrency(dashboard.sent), peso: `${dashboard.sent_peso} Kg`, color: 'bg-teal-600' },
    { label: 'Aprovados', valor: formatCurrency(dashboard.approved), peso: `${dashboard.approved_peso} Kg`, color: 'bg-orange-500' },
    { label: 'Faturados', valor: formatCurrency(dashboard.invoiced), peso: `${dashboard.invoiced_peso} Kg`, color: 'bg-cyan-500' },
    { label: 'Cancelados', valor: formatCurrency(dashboard.canceled), peso: `${dashboard.canceled_peso} Kg`, color: 'bg-blue-700' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pedidos</h1>
          <Button className="gap-2 bg-erp-navy hover:bg-erp-navy/90 text-xs sm:text-sm" onClick={() => navigate('/pedidos/criar')}>
            <Plus size={16} /> <span className="hidden sm:inline">Criar</span> Pedido
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className={`${kpi.color} text-white rounded-lg p-4 relative`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{kpi.label}</span>
                <FileText size={18} className="opacity-70" />
              </div>
              <div className="text-lg font-bold mt-1">{kpi.valor}</div>
              <div className="text-xs opacity-80">{kpi.peso}</div>
            </div>
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
            <span className="text-xs sm:text-sm text-muted-foreground">{totalRecords} registros</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
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
                    <TableHead className="text-xs font-bold text-foreground">CÓDIGO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">CLIENTE</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DOCUMENTO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">LOCALIZAÇÃO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">STATUS</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">VALOR</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">PESO(KG)</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DATA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((o: any, idx: number) => {
                      const code = o.orc_codorc || o.codigo || '';
                      const st = statusMap[o.orc_status] || { label: o.orc_status || '—', color: 'bg-muted' };
                      return (
                        <TableRow key={`${code}-${idx}`} className="hover:bg-accent/30 cursor-pointer" onClick={() => navigate(`/pedidos/${o.orc_codorc_web || code}`)}>
                          <TableCell className="text-sm font-semibold underline">{code}</TableCell>
                          <TableCell className="text-sm">
                            <div>{o.orc_codter || ''} - {o.ter_nomter || o.cliente || ''}</div>
                            {(o.ter_fanter || o.subtexto) && (
                              <div className="text-xs text-muted-foreground">{o.ter_fanter || o.subtexto}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatDoc(o.ter_documento || o.documento || '')}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {o.TEN_CIDLGR && o.TEN_UF_LGR ? `${o.TEN_CIDLGR} - ${o.TEN_UF_LGR}` : o.localizacao || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={`${st.color} text-white text-xs px-2 py-1 rounded`}>
                              {st.label}
                            </span>
                            {o.orc_erp && (
                              <div className="text-xs text-muted-foreground mt-1">ERP:{o.orc_erp}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatCurrency(o.orc_vlrorc || 0)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{o.orc_peso || 0}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatDate(o.orc_dtaorc || '')}</TableCell>
                        </TableRow>
                      );
                    })
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
    </div>
  );
};

export default Pedidos;
