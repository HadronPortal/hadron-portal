import { useState, useEffect, useRef } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import ColumnToggle, { type ColumnDef } from '@/components/erp/ColumnToggle';

const CATALOGO_COLUMNS: ColumnDef[] = [
  { key: 'cod', label: 'COD PROD' },
  { key: 'foto', label: 'FOTO' },
  { key: 'descricao', label: 'DESCRIÇÃO' },
  { key: 'grupo', label: 'GRUPO' },
  { key: 'prev_saida', label: 'PREV SAÍDA' },
  { key: 'prev_entra', label: 'PREV ENTRA' },
  { key: 'saldo_atual', label: 'SALDO ATUAL' },
  { key: 'saldo_futuro', label: 'SALDO FUTURO' },
];

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
  const { representantes } = useRepresentantes();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(CATALOGO_COLUMNS.map(c => [c.key, true]))
  );

  const totalPages = Math.ceil(totalRecords / limit);

  const fetchCatalogo = async (p: number, l: number, repCodes: number[] = selectedRep, signal?: AbortSignal) => {
    try {
      setIsFetching(true);
      setError(null);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let url = `https://${projectId}.supabase.co/functions/v1/fetch-catalogo?page=${p}&limit=${l}`;
      if (repCodes.length > 0) url += `&rep=${repCodes.join(',')}`;
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
  }, [page, limit, selectedRep]);

  const handleRepChange = (repCodes: number[]) => setSelectedRep(repCodes);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Itens por página:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="appearance-none border border-border rounded-md pl-3 pr-7 py-1.5 text-sm bg-card text-foreground h-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
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
          <Spinner />
        ) : error && items.length === 0 ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <div className="relative">
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                <div className="rounded-full border-[3px] border-muted border-t-primary animate-spin w-8 h-8" />
              </div>
            )}
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
                  {filteredItems.map((item) => (
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalogo;
