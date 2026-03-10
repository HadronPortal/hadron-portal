import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';

interface ProductAPI {
  codpro: number;
  produto: string;
  foto: string;
  qtde: number;
  peso_un: number;
  valor: number;
  tipo_op_banco?: string;
  gtin?: string;
  [key: string]: unknown;
}

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?url=`;

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'AG', label: 'Amostra Grátis' },
  { key: 'BN', label: 'Bonificados' },
] as const;

const Produtos = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-products?page=${page}&limit=${rowsPerPage}`
        );
        if (!res.ok) throw new Error('Falha ao buscar produtos');
        const data = await res.json();
        setProducts(data.products || []);
        setTotalRecords(data.total_records || 0);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage]);

  const filtered = (activeTab === 'todos'
    ? products
    : products.filter((p) => p.tipo_op_banco === activeTab)
  ).filter((p) => (p.produto || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>

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
            <span className="text-sm text-muted-foreground">{totalRecords} registros</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Pesquisar</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 h-8 text-sm"
            />
          </div>
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
                      const imgUrl = p.foto
                        ? `${PROXY_BASE}${encodeURIComponent(`https://dev.hadronweb.com.br/user_data/DEV/products/${p.foto}`)}`
                        : '';
                      return (
                        <TableRow key={p.codpro} className="hover:bg-accent/30 cursor-pointer" onClick={() => navigate(`/produtos/${p.codpro}`)}>
                          <TableCell className="text-sm">{p.codpro}</TableCell>
                          <TableCell>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.produto}
                                className="w-14 h-14 object-contain rounded bg-muted"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded bg-muted" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{p.produto}</TableCell>
                          <TableCell className="text-sm">{p.qtde ?? 0}</TableCell>
                          <TableCell className="text-sm">{((p.qtde ?? 0) * (p.peso_un ?? 0)).toFixed(1)} Kg</TableCell>
                          <TableCell className="text-sm">{formatCurrency(p.valor ?? 0)}</TableCell>
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

export default Produtos;
