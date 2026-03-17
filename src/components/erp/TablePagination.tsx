import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  page: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
}

const TablePagination = ({ page, totalRecords, rowsPerPage, onPageChange }: TablePaginationProps) => {
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  if (totalPages <= 1 && totalRecords <= 0) return null;

  const showPageButtons = totalPages > 1;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-border">
      <p className="text-xs text-muted-foreground hidden sm:block">
        Mostrando {Math.min((page - 1) * rowsPerPage + 1, totalRecords)} a {Math.min(page * rowsPerPage, totalRecords)} de {totalRecords}
      </p>
      {showPageButtons && (
        <div className="flex items-center gap-1 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {p}
              </button>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TablePagination;
