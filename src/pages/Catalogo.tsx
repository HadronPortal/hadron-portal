import { useState, useMemo, useCallback } from 'react';
import { useSessionState } from '@/hooks/use-session-state';
import { useNavigate, useLocation } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package, Boxes, Search, LayoutGrid, List, Info } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import CatalogoDetalhe from '@/components/erp/CatalogoDetalhe';
import CatalogoFilterBar, { CatalogoFilters, defaultFilters } from '@/components/erp/CatalogoFilterBar';
import { useApiFetch } from '@/hooks/use-api-fetch';
import ScrollToTop from '@/components/ScrollToTop';
import { exportPDF, exportCSV, exportXLSX, fetchAllForExport } from '@/lib/export-utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

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
  SALDO_DISPONIVEL?: number | string | null;
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
  const { theme, setTheme } = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useSessionState('catalogo_limit', 12);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useSessionState('catalogo_search', '');
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; foto: string; saldos?: number; saldoFisico?: number; prevSaida?: number } | null>(null);
  const [viewMode, setViewMode] = useSessionState<'list' | 'grid'>('catalogo_viewMode', 'list');
  const [filters, setFilters] = useSessionState<CatalogoFilters>('catalogo_filters', defaultFilters);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : '';

  const getSaldo = (item: CatalogoItem) => {
    return Number(item.SALDO_DISPONIVEL) || 0;
  };

  const formatSaldo = (num: number) => {
    return isNaN(num) ? '0' : num.toLocaleString('pt-BR');
  };

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

  const hasLocalFilters = !!(filters.skuFrom || filters.skuTo || filters.priceMin || filters.priceMax || filters.category || (filters.stockFilter && filters.stockFilter !== 'all'));
  const totalRecords = hasLocalFilters ? items.length : (data?.total_records || 0);
  const totalPages = hasLocalFilters ? 1 : Math.ceil((data?.total_records || 0) / limit);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const getImageUrl = (filename: string) =>
    `https://${projectId}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;

  const startItem = hasLocalFilters ? (items.length > 0 ? 1 : 0) : (page - 1) * limit + 1;
  const endItem = hasLocalFilters ? items.length : Math.min(page * limit, data?.total_records || 0);

  const catalogoColumns = [
    { header: 'SKU', accessor: (r: any) => r.pro_codpro },
    { header: 'Produto', accessor: (r: any) => r.pro_despro },
    { header: 'Grupo', accessor: (r: any) => r.NOME_GRUPO || '' },
    { header: 'Preço', accessor: (r: any) => Number(r.pro_preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), align: 'right' as const },
    { header: 'Estoque', accessor: (r: any) => formatSaldo(getSaldo(r)), align: 'right' as const },
  ];

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      setExporting(true);
      toast.info('Buscando todos os produtos...');

      const allData = await fetchAllForExport(
        'fetch-catalogo',
        {
          ...(repParam ? { rep: repParam } : {}),
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        },
        'catalogs',
      );

      if (allData.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const opts = { title: 'Catálogo de Produtos', columns: catalogoColumns, data: allData, fileName: 'catalogo' };
      if (format === 'pdf') exportPDF(opts);
      else if (format === 'csv') exportCSV(opts);
      else exportXLSX(opts);
      toast.success(`Exportação ${format.toUpperCase()} gerada com ${allData.length} produtos!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar');
    } finally {
      setExporting(false);
    }
  }, [repParam, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))] transition-colors duration-200">
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
        <div className="h-10 sm:h-16" />
      </div>

      <div className="bg-card flex-1">
      {/* Content overlaps into the black hero */}
      <main className="px-3 sm:px-6 lg:px-12 xl:px-20 py-4 sm:py-5 space-y-4 max-w-[1600px] mx-auto w-full -mt-10 sm:-mt-16 relative z-10">
        {/* Main Title section matching other pages */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground tracking-tight">
              <Package className="text-primary" size={36} />
              Catálogo
            </h1>
            <p className="text-muted-foreground text-[15px]">Consulte o acervo completo de produtos e disponibilidades.</p>
          </div>
        </div>

        {/* Filter bar with integrated search */}
        <CatalogoFilterBar
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(1); }}
          categories={categories}
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
          onExport={handleExport}
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
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
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
                      onClick={() => setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto, saldos: Number(item.SALDOS) || 0, saldoFisico: Number(item.SALDO_FISICO) || 0, prevSaida: Number(item.PREV_SAIDA) || 0 })}
                      className="bg-[#121212] rounded-xl border border-white/5 hover:border-primary/50 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden shadow-2xl"
                    >
                      {/* Image Area */}
                      <div className="relative aspect-square bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                        {item.pro_foto ? (
                          <img
                            src={getImageUrl(item.pro_foto)}
                            alt={item.pro_despro}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <Package className="w-12 h-12 text-white" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                            inStock
                              ? 'bg-green-500/10 text-[#00FF88] border border-green-500/20'
                              : 'bg-red-500/10 text-[#FF4444] border border-red-500/20'
                          }`}>
                            {inStock ? 'Em Estoque' : 'Esgotado'}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[13px] font-bold text-white uppercase leading-tight line-clamp-2">
                            {item.pro_despro}
                          </h3>
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                            #{item.pro_codpro}
                          </span>
                        </div>

                        {item.NOME_GRUPO && (
                          <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <Boxes size={12} className="text-primary/70" />
                            <span className="text-[10px] uppercase tracking-wide truncate">{item.NOME_GRUPO}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-4 flex items-end justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest block">Saldo</span>
                            <span className={`text-lg font-black tabular-nums leading-none ${inStock ? 'text-white' : 'text-red-500/70'}`}>
                              {formatSaldo(saldoNum)}
                            </span>
                          </div>
                          
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                            <Info size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                    <div
                      key={item.pro_codpro}
                      onClick={() => setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto, saldos: Number(item.SALDOS) || 0, saldoFisico: Number(item.SALDO_FISICO) || 0, prevSaida: Number(item.PREV_SAIDA) || 0 })}
                      className="bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-start sm:items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-2.5 group flex-wrap sm:flex-nowrap"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {item.pro_foto ? (
                          <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Package className="w-7 h-7 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:truncate">{item.pro_despro}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${inStock ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            <Boxes className="w-3 h-3" />{formatSaldo(saldoNum)}
                          </span>
                          <span className="text-xs text-muted-foreground"><span className="hidden sm:inline">SKU: </span><span className="font-mono font-medium text-foreground">{item.pro_codpro}</span></span>
                          {item.NOME_GRUPO && <span className="text-xs text-muted-foreground hidden sm:inline">Grupo: <span className="font-medium text-foreground">{item.NOME_GRUPO}</span></span>}
                          {item.pro_preco != null && Number(item.pro_preco) > 0 && (
                            <span className="text-xs font-bold text-primary whitespace-nowrap">R$ {Number(item.pro_preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          )}
                        </div>
                      </div>
                    <div className="flex-shrink-0 flex items-center">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); setSelectedProduct({ id: item.pro_codpro, name: item.pro_despro, foto: item.pro_foto, saldos: Number(item.SALDOS) || 0, saldoFisico: Number(item.SALDO_FISICO) || 0, prevSaida: Number(item.PREV_SAIDA) || 0 }); }}>
                        <Package className="w-3.5 h-3.5" /><span className="hidden sm:inline">Ver Detalhes</span><span className="sm:hidden">Ver</span>
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
                      className={`w-8 h-8 p-0 ${pageNum === page ? 'bg-primary hover:bg-primary/90 text-white border-0' : ''}`}
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
          catalogSaldos={selectedProduct?.saldos}
          catalogSaldoFisico={selectedProduct?.saldoFisico}
          catalogPrevSaida={selectedProduct?.prevSaida}
        />
      </main>
      </div>
    </div>
  );
};

export default Catalogo;
