import { useState, useEffect, useRef, useTransition } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CatalogoItem {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  NOME_GRUPO: string | null;
  SALDOS: string;
  pro_codgrp: number;
}

const pageCache = new Map<string, { catalogs: CatalogoItem[]; total_records: number }>();

const Catalogo = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalPages = Math.ceil(totalRecords / limit);

  useEffect(() => {
    const cacheKey = `${page}-${limit}`;
    const cached = pageCache.get(cacheKey);

    if (cached) {
      setItems(cached.catalogs);
      setTotalRecords(cached.total_records);
      setInitialLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchCatalogo = async () => {
      try {
        setIsFetching(true);
        setError(null);

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-catalogo?page=${page}&limit=${limit}`,
          { headers: { 'Content-Type': 'application/json' }, signal: controller.signal }
        );

        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();

        const result = { catalogs: data?.catalogs || [], total_records: data?.total_records || 0 };
        pageCache.set(cacheKey, result);

        if (!controller.signal.aborted) {
          setItems(result.catalogs);
          setTotalRecords(result.total_records);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Erro ao buscar catálogo:', err);
        setError(err.message || 'Erro ao carregar catálogo');
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
          setIsFetching(false);
        }
      }
    };

    // Prefetch next page
    const prefetch = (p: number) => {
      const key = `${p}-${limit}`;
      if (pageCache.has(key) || p < 1) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      fetch(`https://${projectId}.supabase.co/functions/v1/fetch-catalogo?page=${p}&limit=${limit}`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(r => r.json()).then(data => {
        pageCache.set(key, { catalogs: data?.catalogs || [], total_records: data?.total_records || 0 });
      }).catch(() => {});
    };

    fetchCatalogo().then(() => {
      // Prefetch adjacent pages
      prefetch(page + 1);
      if (page > 1) prefetch(page - 1);
    });

    return () => controller.abort();
  }, [page, limit]);

  const formatSaldo = (saldo: string) => {
    const num = parseFloat(saldo);
    return isNaN(num) ? saldo : num.toLocaleString('pt-BR');
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const getImageUrl = (filename: string) =>
    `https://${projectId}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
          {isFetching && <Loader2 className="animate-spin text-muted-foreground" size={18} />}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Itens por página:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded px-1.5 py-0.5 text-xs bg-card text-foreground w-16"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

        {initialLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : error && items.length === 0 ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <div className={`bg-card rounded-lg border border-border overflow-hidden transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground">CÓD</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">FOTO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">DESCRIÇÃO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">GRUPO</TableHead>
                    <TableHead className="text-xs font-bold text-foreground text-right">SALDO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.pro_codpro} className="hover:bg-accent/30">
                      <TableCell className="text-sm">{item.pro_codpro}</TableCell>
                      <TableCell>
                        {item.pro_foto ? (
                          <img
                            src={getImageUrl(item.pro_foto)}
                            alt={item.pro_despro}
                            className="w-14 h-14 object-contain rounded bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{item.pro_despro}</TableCell>
                      <TableCell className="text-sm">{item.NOME_GRUPO || '—'}</TableCell>
                      <TableCell className="text-sm text-right">{formatSaldo(item.SALDOS)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
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
      </main>
    </div>
  );
};

export default Catalogo;
