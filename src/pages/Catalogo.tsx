import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package, Boxes, Search, LayoutGrid, List } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import CatalogoDetalhe from '@/components/erp/CatalogoDetalhe';
import CatalogoFilterBar, { CatalogoFilters, defaultFilters } from '@/components/erp/CatalogoFilterBar';
import { useApiFetch } from '@/hooks/use-api-fetch';
import ScrollToTop from '@/components/ScrollToTop';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

interface CatalogoItem {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  NOME_GRUPO: string | null;
  SALDOS: number | string;
  SALDO_FISICO?: number | string | null;
  PREV_SAIDA?: number | string | null;
  pro_codgrp: number;
  pro_preco?: number | string | null;
}

interface CatalogoAPIResponse {
  catalogs: CatalogoItem[];
  total_records: number;
}

const Catalogo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; foto: string; saldos?: number; saldoFisico?: number; prevSaida?: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState<CatalogoFilters>(defaultFilters);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';

  const { data, isLoading, isFetching, error } = useApiFetch<CatalogoAPIResponse>({
    queryKey: ['catalogo', String(page), String(limit), repParam, searchQuery],
    endpoint: 'fetch-catalogo',
    params: {
      page: String(page),
      limit: String(limit),
      ...(repParam ? { rep: repParam } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    },
    staleTime: 2 * 60 * 1000, // 2 min cache
    placeholderData: keepPreviousData,
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (data?.catalogs || []).forEach((item) => {
      if (item.NOME_GRUPO) cats.add(item.NOME_GRUPO);
    });
    return Array.from(cats).sort();
  }, [data]);

  const items = useMemo(() => {
    let list = [...(data?.catalogs || [])];

    // SKU range
    if (filters.skuFrom) list = list.filter((i) => i.pro_codpro >= Number(filters.skuFrom));
    if (filters.skuTo) list = list.filter((i) => i.pro_codpro <= Number(filters.skuTo));

    // Price range
    if (filters.priceMin) list = list.filter((i) => Number(i.pro_preco || 0) >= Number(filters.priceMin));
    if (filters.priceMax) list = list.filter((i) => Number(i.pro_preco || 0) <= Number(filters.priceMax));

    // Category
    if (filters.category) list = list.filter((i) => i.NOME_GRUPO === filters.category);

    // Stock
    if (filters.stockFilter === 'in_stock') list = list.filter((i) => getSaldo(i) > 0);
    if (filters.stockFilter === 'out_of_stock') list = list.filter((i) => getSaldo(i) <= 0);

    // Sort
    const dir = filters.sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (filters.sortField) {
        case 'sku': return (a.pro_codpro - b.pro_codpro) * dir;
        case 'name': return a.pro_despro.localeCompare(b.pro_despro) * dir;
        case 'price': return (Number(a.pro_preco || 0) - Number(b.pro_preco || 0)) * dir;
        case 'stock': return (getSaldo(a) - getSaldo(b)) * dir;
        default: return 0;
      }
    });

    return list;
  }, [data, filters]);

  const totalRecords = data?.total_records || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const getSaldo = (item: CatalogoItem) => {
    return Number(item.SALDOS) || 0;
  };

  const formatSaldo = (num: number) => {
    return isNaN(num) ? '0' : num.toLocaleString('pt-BR');
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const getImageUrl = (filename: string) =>
    `https://${projectId}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalRecords);

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Catálogo</h1>
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
        <div className="h-10 sm:h-16" />
      </div>

      <div className="bg-card flex-1">
      {/* Content overlaps into the black hero */}
      <main className="px-3 sm:px-6 lg:px-12 xl:px-20 py-4 sm:py-5 space-y-4 max-w-[1600px] mx-auto w-full -mt-10 sm:-mt-16 relative z-10">
        {/* Filter bar with integrated search */}
        <CatalogoFilterBar
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(1); }}
          categories={categories}
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        />

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

            {/* View mode toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading && items.length === 0 ? (
          <Spinner />
        ) : error && items.length === 0 ? (
          <div className="text-center py-20 text-destructive">{(error as Error).message}</div>
        ) : (
          <div className="relative">
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                <Spinner className="py-0" />
              </div>
            )}

            {/* Product cards */}
            <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'} ${
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-2.5'
            }`}>
              {items.map((item) => {
                const saldoNum = getSaldo(item);
                const inStock = saldoNum > 0;

                if (viewMode === 'grid') {
                  return (
                    <div
                      key={item.pro_codpro}
                      onClick={() => setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto })}
                      className="bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
                    >
                      {/* Image */}
                      <div className="aspect-square rounded-t-lg bg-muted flex items-center justify-center overflow-hidden p-4">
                        {item.pro_foto ? (
                          <img
                            src={getImageUrl(item.pro_foto)}
                            alt={item.pro_despro}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {item.pro_despro}
                        </h3>
                        
                        {item.pro_preco != null && Number(item.pro_preco) > 0 && (
                          <span className="text-sm font-bold text-primary mt-1">
                            R$ {Number(item.pro_preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              inStock
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              <Boxes className="w-3 h-3" />
                              {formatSaldo(saldoNum)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">SKU: <span className="font-mono font-medium text-foreground">{item.pro_codpro}</span></span>
                          </div>
                          <Button variant="outline" size="sm" className="text-[11px] gap-1 h-7 px-2">
                            <Package className="w-3 h-3" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.pro_codpro}
                    onClick={() => setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto })}
                    className="bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {item.pro_foto ? (
                        <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <Package className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.pro_despro}</h3>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${inStock ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <Boxes className="w-3 h-3" />{formatSaldo(saldoNum)}
                        </span>
                        <span className="text-xs text-muted-foreground"><span className="hidden sm:inline">SKU: </span><span className="font-mono font-medium text-foreground">{item.pro_codpro}</span></span>
                        {item.NOME_GRUPO && <span className="text-xs text-muted-foreground">Grupo: <span className="font-medium text-foreground">{item.NOME_GRUPO}</span></span>}
                        {item.pro_preco != null && Number(item.pro_preco) > 0 && (
                          <span className="text-xs font-bold text-primary whitespace-nowrap">R$ {Number(item.pro_preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto }); }}>
                        <Package className="w-3.5 h-3.5" />Ver Detalhes
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
                <ScrollToTop />
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
      </div>
    </>
  );
};

export default Catalogo;
