import { useState, useMemo } from 'react';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface Period {
  chave: string;
  legenda: string;
  total_peso: number;
  total_valor: number;
}

interface ProductAnalytics {
  codpro: number;
  produto: string;
  foto: string;
  gtin: string;
  peso_un: number;
  tipo_op_banco: string;
  mensal: Record<string, { qtde: number; valor: number }>;
  totais: { qtde: number; valor: number };
}

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'VN', label: 'Vendas' },
  { key: 'BN', label: 'Bonificação' },
  { key: 'AG', label: 'Amostra Grátis' },
] as const;

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatWeight = (v: number) =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' Kg';

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?url=`;

const Analitico = () => {
  const [activeTab, setActiveTab] = useState<string>('todos');
  const { representantes } = useRepresentantes();
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : undefined;

  const { data, isLoading: loading, error: queryError } = useApiFetch<any>({
    queryKey: ['analytics', String(page), String(rowsPerPage), repParam || 'all'],
    endpoint: 'fetch-analytics',
    params: {
      page: String(page),
      limit: String(rowsPerPage),
      ...(repParam ? { rep: repParam } : {}),
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const error = queryError ? (queryError as Error).message : null;
  const products: ProductAnalytics[] = data?.products || [];
  const periods: Period[] = (data?.periods || []).filter((p: Period) => p.chave !== 'TOTAL');
  const totalRecords: number = data?.total_records || 0;

  const handleRepChange = (_repCodes: number[]) => {
    // State is set via handleFilter which is called automatically
  };
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilter = (filters: { startDate: Date; endDate: Date; repCodes: number[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
    setPage(1);
  };
  const handleClear = () => {
    setSelectedRep([]);
    setSearchQuery('');
    setPage(1);
  };

  const tabFiltered = activeTab === 'todos'
    ? products
    : products.filter((p) => p.tipo_op_banco === activeTab);

  const filtered = searchQuery.trim()
    ? tabFiltered.filter(p => (p.produto || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : tabFiltered;

  const totalPeriod = periods;
  const grandTotal = products.reduce((acc, p) => ({
    valor: acc.valor + (p.totais?.valor || 0),
    qtde: acc.qtde + (p.totais?.qtde || 0),
    peso: acc.peso + (p.totais?.qtde || 0) * (p.peso_un || 0),
  }), { valor: 0, qtde: 0, peso: 0 });

  return (
    <>

      <FilterBar representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Analítico Período</h1>

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
            <span className="text-sm text-muted-foreground">{totalRecords} registros</span>
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
                    <TableHead className="text-xs font-bold text-foreground">PRODUTO</TableHead>
                    {totalPeriod.map((p) => (
                      <TableHead key={p.chave} className="text-xs font-bold text-foreground">
                        {p.legenda}
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-bold text-foreground">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={totalPeriod.length + 2} className="text-center text-muted-foreground py-6">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((produto) => {
                      const imgUrl = produto.foto
                        ? `${PROXY_BASE}${encodeURIComponent(`https://dev.hadronweb.com.br/user_data/DEV/products/${produto.foto}`)}`
                        : '';
                      return (
                        <TableRow key={produto.codpro} className="hover:bg-accent/30">
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-3">
                              {imgUrl && (
                                <img
                                  src={imgUrl}
                                  alt={produto.produto}
                                  className="w-10 h-10 object-contain rounded bg-muted"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <span className="font-semibold">{produto.codpro}-{produto.produto}</span>
                            </div>
                          </TableCell>
                          {totalPeriod.map((p) => {
                            const m = produto.mensal?.[p.chave];
                            return (
                              <TableCell key={p.chave} className="text-sm">
                                {m ? (
                                  <>
                                    <div>{formatCurrency(m.valor)} ({m.qtde})</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatWeight(m.qtde * (produto.peso_un || 0))}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-sm">
                            <div className="text-foreground">
                              {formatCurrency(produto.totais?.valor || 0)} ({produto.totais?.qtde || 0})
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatWeight((produto.totais?.qtde || 0) * (produto.peso_un || 0))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {filtered.length > 0 && (
                    <TableRow className="border-t-2 border-border">
                      <TableCell className="text-sm font-bold text-foreground">TOTAL</TableCell>
                      {totalPeriod.map((p) => (
                        <TableCell key={p.chave} className="text-sm">
                          <div className="font-bold text-foreground">{formatCurrency(p.total_valor)}</div>
                          <div className="text-xs font-bold text-foreground">{formatWeight(p.total_peso)}</div>
                        </TableCell>
                      ))}
                      <TableCell className="text-sm">
                        <div className="font-bold text-foreground">{formatCurrency(grandTotal.valor)}</div>
                        <div className="text-xs font-bold text-foreground">{formatWeight(grandTotal.peso)}</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination */}
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

export default Analitico;
