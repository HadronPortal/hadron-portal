import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package, Boxes, Search } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import CatalogoDetalhe from '@/components/erp/CatalogoDetalhe';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Analítico', path: '/analitico' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Catálogo', path: '/catalogo' },
];

interface CatalogoItem {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  NOME_GRUPO: string | null;
  SALDOS: string;
  pro_codgrp: number;
}

const Catalogo = () => {
  const { representantes } = useRepresentantes();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; foto: string } | null>(null);

  const totalPages = Math.ceil(totalRecords / limit);

  const fetchCatalogo = async (p: number, l: number, repCodes: number[] = selectedRep, signal?: AbortSignal) => {
    try {
      setIsFetching(true);
      setError(null);
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let url = `https://${projectId}.supabase.co/functions/v1/fetch-catalogo?page=${p}&limit=${l}`;
      if (repCodes.length > 0) url += `&rep=${repCodes.join(',')}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, signal });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const catalogs = (data?.catalogs || []).sort((a: CatalogoItem, b: CatalogoItem) => a.pro_codpro - b.pro_codpro);
      return { catalogs, total_records: data?.total_records || 0 };
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  };

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const load = async () => {
      try {
        const result = await fetchCatalogo(page, limit, selectedRep, controller.signal);
        if (result && !controller.signal.aborted) {
          setItems(result.catalogs);
          setTotalRecords(result.total_records);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error('Erro ao buscar catálogo:', err);
          setError(err.message || 'Erro ao carregar catálogo');
        }
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
          setIsFetching(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [page, limit, selectedRep, searchQuery]);

  const handleRepChange = (_repCodes: number[]) => {};
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

  const filteredItems = searchQuery.trim()
    ? items.filter(i => {
        const q = searchQuery.toLowerCase();
        return (i.pro_despro || '').toLowerCase().includes(q) || String(i.pro_codpro).includes(q);
      })
    : items;

  const formatSaldo = (saldo: string) => {
    const num = parseFloat(saldo);
    return isNaN(num) ? saldo : num.toLocaleString('pt-BR');
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const getImageUrl = (filename: string) =>
    `https://${projectId}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalRecords);

  return (
    <>
      {/* Search bar */}
      <div className="max-w-[1100px] mx-auto w-full px-3 sm:px-6 lg:px-12 xl:px-20 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full h-10 pl-9 pr-16 rounded-lg border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          
        </div>
      </div>

      <main className="flex-1 px-3 sm:px-6 lg:px-12 xl:px-20 py-4 sm:py-5 space-y-4 bg-card max-w-[1100px] mx-auto w-full">
        {/* Header with results count and per-page */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{startItem} - {endItem}</span> de{' '}
            <span className="font-semibold text-primary">{totalRecords}</span> resultados
            {searchQuery && (
              <> para <span className="font-semibold text-primary">{searchQuery}</span></>
            )}
          </p>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none border border-border rounded-lg pl-3 pr-7 py-1.5 text-sm bg-card text-foreground h-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
            >
              <option value={12}>12</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {initialLoading && items.length === 0 ? (
          <Spinner />
        ) : error && items.length === 0 ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <div className="relative">
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                <Spinner className="py-0" />
              </div>
            )}

            {/* Product list cards */}
            <div className={`space-y-2.5 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {filteredItems.map((item) => {
                const saldoNum = parseFloat(item.SALDOS);
                const inStock = !isNaN(saldoNum) && saldoNum > 0;

                return (
                  <div
                    key={item.pro_codpro}
                    onClick={() => setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto })}
                    className="bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 group"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {item.pro_foto ? (
                        <img
                          src={getImageUrl(item.pro_foto)}
                          alt={item.pro_despro}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Package className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.pro_despro}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
                        {/* Stock badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          inStock
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <Boxes className="w-3 h-3" />
                          {formatSaldo(item.SALDOS)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          <span className="hidden sm:inline">SKU: </span>
                          <span className="font-mono font-medium text-foreground">{item.pro_codpro}</span>
                        </span>

                        {item.NOME_GRUPO && (
                          <span className="text-xs text-muted-foreground">
                            Grupo: <span className="font-medium text-foreground">{item.NOME_GRUPO}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: View details */}
                    <div className="flex-shrink-0 flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto });
                        }}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages} — {totalRecords} produtos
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      disabled={isFetching}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        <CatalogoDetalhe
          open={!!selectedProduct}
          onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
          productId={selectedProduct?.id ?? null}
          productName={selectedProduct?.name}
          productFoto={selectedProduct?.foto}
        />
      </main>
    </>
  );
};

export default Catalogo;
