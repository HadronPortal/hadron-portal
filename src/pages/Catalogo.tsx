import { useState, useEffect } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CatalogoItem {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  NOME_GRUPO: string | null;
  SALDOS: string;
  pro_codgrp: number;
}

const Catalogo = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalRecords / limit);

  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        setLoading(true);
        setError(null);

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-catalogo?page=${page}&limit=${limit}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();

        setItems(data?.catalogs || []);
        setTotalRecords(data?.total_records || 0);
      } catch (err: any) {
        console.error('Erro ao buscar catálogo:', err);
        setError(err.message || 'Erro ao carregar catálogo');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogo();
  }, [page, limit]);

  const formatSaldo = (saldo: string) => {
    const num = parseFloat(saldo);
    return isNaN(num) ? saldo : num.toLocaleString('pt-BR');
  };

  const imageBaseUrl = 'https://dev.hadronweb.com.br/uploads/produtos/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
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
                            src={`${imageBaseUrl}${item.pro_foto}`}
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages} — {totalRecords} produtos
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
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
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
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
