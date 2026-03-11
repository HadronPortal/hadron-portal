import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Spinner from '@/components/ui/spinner';

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

const Produtos = () => {
  const navigate = useNavigate();
  const { representantes } = useRepresentantes();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [dateIni, setDateIni] = useState('');
  const [dateEnd, setDateEnd] = useState('');
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
  const loading = isLoading || isFetching;

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

  return (
    <>
      <FilterBar representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Produtos</h1>

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
            <span className="text-xs sm:text-sm text-muted-foreground">{totalRecords} registros</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground hidden sm:inline">Pesquisar</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="w-32 sm:w-40 h-8 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground">COD</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">FOTO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DESCRIÇÃO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">QTDE</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">PESO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">VALOR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const imgUrl = p.pro_foto
                        ? `${PROXY_BASE}${encodeURIComponent(`https://dev.hadronweb.com.br/user_data/DEV/products/${p.pro_foto}`)}`
                        : '';
                      const qtde = parseFloat(p.QUANT || '0');
                      const totalVendido = parseFloat(p.TOTAL_VENDIDO || '0');
                      return (
                        <TableRow key={p.pro_codpro} className="hover:bg-accent/30 cursor-pointer" onClick={() => navigate(`/produtos/${p.pro_codpro}`)}>
                          <TableCell className="text-sm">{p.pro_codpro}</TableCell>
                          <TableCell>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.pro_despro}
                                className="w-14 h-14 object-contain rounded bg-muted"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded bg-muted" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{p.pro_despro}</TableCell>
                          <TableCell className="text-sm">{qtde}</TableCell>
                          <TableCell className="text-sm">{(qtde * (p.pro_peso_liq ?? 0)).toFixed(1)} {p.pro_unidade || 'Kg'}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(totalVendido)}</TableCell>
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
    </>
  );
};

export default Produtos;
