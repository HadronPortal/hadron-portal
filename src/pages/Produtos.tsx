import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { keepPreviousData } from '@tanstack/react-query';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import TablePagination from '@/components/erp/TablePagination';
import { useSessionState } from '@/hooks/use-session-state';
import { useTheme } from 'next-themes';
import { Sun, Moon, PackageSearch, Search } from 'lucide-react';

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
  [key: string]: unknown;
}

interface ProductsAPIResponse {
  products: ProductAPI[];
  total_records: number;
}

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=`;

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'AG', label: 'Amostra Grátis' },
  { key: 'BN', label: 'Bonificados' },
] as const;

const TABLE_HEADERS = ['COD', 'FOTO', 'DESCRIÇÃO', 'QTDE', 'PESO', 'VALOR'];

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Produtos', path: '/produtos' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

const Produtos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useSessionState('produtos_rowsPerPage', 50);
  const [search, setSearch] = useSessionState('produtos_search', '');
  const [page, setPage] = useState(1);
  const [selectedRep, setSelectedRep] = useSessionState<number[]>('produtos_rep', []);
  const [dateIni, setDateIni] = useSessionState('produtos_dateIni', '');
  const [dateEnd, setDateEnd] = useSessionState('produtos_dateEnd', '');
  const [filterNonce, setFilterNonce] = useState(0);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';

  const { data, isLoading, isFetching } = useApiFetch<ProductsAPIResponse>({
    queryKey: ['products', repParam, dateIni, dateEnd, String(page), String(rowsPerPage), String(filterNonce)],
    endpoint: 'fetch-products',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      ...(repParam ? { rep: repParam } : {}),
      ...(dateIni ? { date_ini: dateIni } : {}),
      ...(dateEnd ? { date_end: dateEnd } : {}),
    },
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const products = data?.products || [];
  const totalRecords = data?.total_records || 0;

  const handleRepChange = () => {};
  const handleSearch = (query: string) => setSearch(query);
  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSearch(filters.search);
    setDateIni(format(filters.startDate, 'yyyy-MM-dd'));
    setDateEnd(format(filters.endDate, 'yyyy-MM-dd'));
    setPage(1);
    setFilterNonce((n) => n + 1);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSearch('');
    setDateIni('');
    setDateEnd('');
    setPage(1);
    setFilterNonce((n) => n + 1);
  };

  const filtered = (activeTab === 'todos'
    ? products
    : products.filter((p) => p.ORC_ORIORC === activeTab)
  ).filter((p) => {
    const q = search.toLowerCase();
    return (p.pro_despro || '').toLowerCase().includes(q) || String(p.pro_codpro).includes(q);
  });

  const showOverlay = isFetching && !isLoading;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))] transition-colors duration-200">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Produtos</h1>
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
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-4 p-2 rounded-full hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              title={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col gap-6 transition-colors duration-200">
          
          {/* Header Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <PackageSearch className="text-[#FF6A00]" size={36} />
              Produtos
            </h1>
            <p className="text-muted-foreground text-[15px]">Consulte o estoque e preços dos produtos.</p>
          </div>

          <FilterBar persistKey="produtos" representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

          <div className="flex items-center gap-2 bg-muted rounded-lg p-1 w-fit max-w-full overflow-x-auto transition-colors duration-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="appearance-none border border-border rounded-lg px-3 py-1.5 text-xs bg-card text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer focus:outline-none focus:ring-1 focus:ring-border transition-colors duration-200"
              >
                <option value={10}>10 linhas</option>
                <option value={25}>25 linhas</option>
                <option value={50}>50 linhas</option>
                <option value={100}>100 linhas</option>
              </select>
              <span className="text-xs text-muted-foreground">{totalRecords} registros encontrados</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="pl-9 h-10 bg-transparent border-border rounded-xl focus-visible:ring-1 focus-visible:ring-border"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable columns={6} rows={10} headers={TABLE_HEADERS} />
          ) : (
            <div className={`relative transition-opacity duration-300 ${showOverlay ? 'opacity-60' : 'opacity-100'}`}>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b border-border">
                        {TABLE_HEADERS.map(h => (
                          <TableHead key={h} className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border">
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((p) => {
                          const fileName = p.pro_foto ? p.pro_foto.split('/').pop() || '' : '';
                          const imgUrl = fileName ? `${PROXY_BASE}${encodeURIComponent(fileName)}` : '';
                          const qtde = parseFloat(p.QUANT || '0');
                          const totalVendido = parseFloat(p.TOTAL_VENDIDO || '0');
                          return (
                            <TableRow key={p.pro_codpro} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/produtos/${p.pro_codpro}`)}>
                              <TableCell className="px-6 py-5 text-sm font-bold text-primary hover:underline">#{p.pro_codpro}</TableCell>
                              <TableCell className="px-6 py-5">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={p.pro_despro}
                                    className="w-14 h-14 object-contain rounded-lg bg-muted p-1"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                    <PackageSearch className="text-muted-foreground/30" size={24} />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="px-6 py-5">
                                <div className="text-sm font-bold text-foreground line-clamp-2">{p.pro_despro}</div>
                                <div className="text-[11px] text-muted-foreground mt-1">Ref: {p.pro_codint || '—'}</div>
                              </TableCell>
                              <TableCell className="px-6 py-5 text-sm font-medium text-foreground">{qtde} {p.pro_unidade || 'un'}</TableCell>
                              <TableCell className="px-6 py-5 text-sm text-foreground/80">{(qtde * (p.pro_peso_liq ?? 0)).toFixed(1)} Kg</TableCell>
                              <TableCell className="px-6 py-5 text-sm font-bold text-foreground">{formatCurrency(totalVendido)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border bg-muted/30 rounded-b-2xl">
            <TablePagination page={page} totalRecords={totalRecords} rowsPerPage={rowsPerPage} onPageChange={setPage} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Produtos;
