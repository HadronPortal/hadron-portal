import { useMemo } from 'react';
import { useRepresentantes } from '@/hooks/use-representantes';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';

import type { SharedFilterProps } from './RelatorioClientes';

interface Props {
  filters: SharedFilterProps;
}

const RelatorioRepresentantes = ({ filters }: Props) => {
  const { representantes, loading } = useRepresentantes();

  const filtered = useMemo(() => {
    let list = representantes;

    // Filter by selected clients' rep codes
    if (filters.selectedClients.length > 0) {
      const clientRepCodes = new Set(filters.selectedClients.map(c => (c as any).repCode ?? 0).filter(Boolean));
      if (clientRepCodes.size > 0) {
        list = list.filter(r => clientRepCodes.has(r.rep_codrep));
      }
    }

    // Filter by selected rep if any
    if (filters.selectedRepRaw.length > 0) {
      const codes = new Set(filters.selectedRepRaw.map(Number));
      list = list.filter(r => codes.has(r.rep_codrep));
    }

    // Local text search
    const q = (filters.searchInput || '').trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.rep_nomrep.toLowerCase().includes(q) ||
        String(r.rep_codrep).includes(q)
      );
    }

    return list;
  }, [representantes, filters.selectedRepRaw, filters.searchInput, filters.selectedClients]);

  if (loading) {
    return (
      <div className="px-2 sm:px-6 py-4">
        <SkeletonTable columns={2} rows={8} headers={['CÓDIGO', 'REPRESENTANTE']} />
      </div>
    );
  }

  return (
    <>
      <div className="px-5 sm:px-6 pb-2">
        <span className="text-xs text-muted-foreground">{filtered.length} representante{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Código</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Representante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-12 text-sm">
                  Nenhum representante encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rep) => (
                <TableRow key={rep.rep_codrep} className="hover:bg-accent/30 transition-colors border-b border-border/50">
                  <TableCell className="text-sm font-mono text-muted-foreground">{rep.rep_codrep}</TableCell>
                  <TableCell className="text-sm text-foreground font-medium">{rep.rep_nomrep}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default RelatorioRepresentantes;
