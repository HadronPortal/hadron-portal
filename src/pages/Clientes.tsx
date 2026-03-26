import { useState, useEffect } from 'react';
import { useSessionState } from '@/hooks/use-session-state';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Eye, Filter, Users, FileText, ShoppingCart, MapPin, Calendar, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import TablePagination from '@/components/erp/TablePagination';
import { useRepresentantes } from '@/hooks/use-representantes';
import { fetchWithAuth } from '@/lib/auth-refresh';
import FilterPanel from '@/components/erp/FilterPanel';
import AdvancedFilter from '@/components/erp/AdvancedFilter';
import PeriodPicker from '@/components/erp/PeriodPicker';
import { useTheme } from 'next-themes';

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

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'positivados', label: 'Positivados' },
  { key: 'novos', label: 'Novos' },
] as const;

const formatDoc = (doc: string) => {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const formatCurrency = (v: number | string | null) => {
  if (v == null || v === '' || v === 0 || v === '0') return 'R$ 0,00';
  const num = typeof v === 'string' ? parseFloat(v as string) : v;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DEFAULT_START_DATE = new Date(2025, 0, 1);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useSessionState<string>('clientes_tab', 'todos');
  const [rowsPerPage, setRowsPerPage] = useSessionState('clientes_rowsPerPage', 50);
  const [clients, setClients] = useState<ClienteAPI[]>([]);
  const [selectedRep, setSelectedRep] = useSessionState<number[]>('global_rep', []);
  const [selectedPeriodRaw, setSelectedPeriodRaw] = useSessionState('global_period', { startDate: DEFAULT_START_DATE.toISOString(), endDate: DEFAULT_END_DATE.toISOString() });
  const [searchQuery, setSearchQuery] = useSessionState('clientes_searchQuery', '');
  const [searchInput, setSearchInput] = useSessionState('clientes_searchInput', '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterNonce, setFilterNonce] = useState(0);
  const [selectedRepRaw, setSelectedRepRaw] = useSessionState<string[]>('global_repRaw', []);

  const selectedPeriod = { startDate: new Date(selectedPeriodRaw.startDate), endDate: new Date(selectedPeriodRaw.endDate) };
  const setSelectedPeriod = (v: { startDate: Date | string; endDate: Date | string }) => {
    setSelectedPeriodRaw({
      startDate: v.startDate instanceof Date ? v.startDate.toISOString() : v.startDate,
      endDate: v.endDate instanceof Date ? v.endDate.toISOString() : v.endDate,
    });
  };

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const clientFilterMap: Record<string, string> = { todos: 'all', positivados: 'positive', novos: 'new' };
        const params = new URLSearchParams({
          page: String(page),
          limit: String(rowsPerPage),
          date_ini: dateIniParam,
          date_end: dateEndParam,
          client_filter: clientFilterMap[activeTab] || 'all',
        });
        if (repParam) params.set('rep', repParam);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const url = `https://${projectId}.supabase.co/functions/v1/fetch-clients?${params.toString()}`;
        const res = await fetchWithAuth(url, { headers: { 'Content-Type': 'application/json' }, signal: abortController.signal });
        if (cancelled) return;
        if (!res.ok) throw new Error('Falha ao buscar clientes');
        const result = await res.json();
        if (cancelled) return;
        setClients(result.clients || []);
        setTotalRecords(result.total_records || 0);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClients();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [page, rowsPerPage, repParam, dateIniParam, dateEndParam, searchQuery, filterNonce, activeTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))] transition-colors duration-200">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Clientes</h1>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col gap-6 transition-colors duration-200">

        {/* Header Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
            <Users className="text-primary" size={36} />
            Clientes
          </h1>
          <p className="text-muted-foreground text-[15px]">Gerencie sua base de clientes e contatos.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl w-fit mt-2 transition-colors duration-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filter Row */}
        <AdvancedFilter 
          placeholder="Buscar por cliente, documento, cidade..."
          representantes={representantes}
          totalRecords={totalRecords}
          statusOptions={[
            { label: 'Todos', value: 'todos' },
            { label: 'Positivados', value: 'positivados' },
            { label: 'Novos', value: 'novos' },
          ]}
          initialFilters={{
            startDate: selectedPeriod.startDate,
            endDate: selectedPeriod.endDate,
            search: searchQuery,
            repCodes: selectedRep,
            status: activeTab
          }}
          onFilter={(f) => {
            setSearchQuery(f.search);
            setSearchInput(f.search);
            setSelectedPeriod({ startDate: f.startDate, endDate: f.endDate });
            setSelectedRep(f.repCodes || []);
            setSelectedRepRaw((f.repCodes || []).map(String));
            if (f.status) setActiveTab(f.status);
            setPage(1);
            setFilterNonce(n => n + 1);
          }}
        />

        {/* Table Container */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mt-4 shadow-xl transition-colors duration-200">
          {loading ? (
            <div className="p-6">
              <SkeletonTable columns={5} rows={8} headers={['CLIENTE', 'DOCUMENTO / VENDAS', 'LOCALIZAÇÃO', 'STATUS', 'AÇÕES']} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-medium">{error}</div>
          ) : (
            <div className="overflow-x-auto px-1">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Documento / Vendas</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-16 text-sm">Nenhum cliente encontrado.</td>
                    </tr>
                  ) : (
                    clients.map((c) => {
                      const ultVendaDate = c.ULT_VENDA ? new Date(c.ULT_VENDA) : null;
                      const isPositivado = ultVendaDate 
                        ? ultVendaDate >= selectedPeriod.startDate && ultVendaDate <= selectedPeriod.endDate
                        : false;
                      
                      return (
                        <tr key={c.ter_codter} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-5">
                            <div className="font-bold text-foreground text-[15px] max-w-xs xl:max-w-md truncate" title={c.ter_nomter}>
                              {c.ter_nomter}
                            </div>
                            <div className="text-muted-foreground text-xs mt-1">
                              ID: #{String(c.ter_codter).padStart(4, '0')}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-sm text-foreground/80">
                                <FileText size={15} className="text-muted-foreground" />
                                {formatDoc(c.ter_documento)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-foreground/80">
                                <ShoppingCart size={15} className="text-muted-foreground" />
                                Vendas: {formatCurrency(c.TOTAL_VENDAS)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-foreground/80">
                              <MapPin size={15} className="text-muted-foreground" />
                              {c.TEN_CIDLGR}, {c.TEN_UF_LGR}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide
                              ${isPositivado ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-500'}
                            `}>
                              {isPositivado ? 'Ativo' : 'Inativo'}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => navigate(`/clientes/${c.ter_codter}`, { state: { client: c } })}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-blue-500 hover:bg-blue-500/10 transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              <div className="p-4 border-t border-border bg-muted/30">
                <TablePagination page={page} totalRecords={totalRecords} rowsPerPage={rowsPerPage} onPageChange={setPage} />
              </div>
            </div>
          )}
        </div>
        
        </div>
      </main>
    </div>
  );
};

export default Clientes;
