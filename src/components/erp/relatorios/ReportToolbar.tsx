import { memo, useState as useLocalState } from 'react';
import { Search, Download, Filter, CalendarIcon, X, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const opTabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'VN', label: 'Vendas' },
  { key: 'BN', label: 'Bonificação' },
  { key: 'AG', label: 'Amostra Grátis' },
] as const;

interface ReportToolbarProps {
  searchPlaceholder: string;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearch: () => void;
  showFilters: boolean;
  onShowFiltersChange: (v: boolean) => void;
  representantes: any[];
  selectedRepRaw: string[];
  onRepChange: (raw: string[], codes: number[]) => void;
  selectedPeriod: { startDate: Date; endDate: Date };
  onPeriodChange: (p: { startDate: Date; endDate: Date }) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (n: number) => void;
  searchQuery: string;
  showOpTabs?: boolean;
}

const ReportToolbar = memo(({
  searchPlaceholder,
  searchInput,
  onSearchInputChange,
  onSearch,
  showFilters,
  onShowFiltersChange,
  representantes,
  selectedRepRaw,
  onRepChange,
  selectedPeriod,
  onPeriodChange,
  onApplyFilters,
  onClearFilters,
  activeTab,
  onTabChange,
  rowsPerPage,
  onRowsPerPageChange,
  searchQuery,
  showOpTabs = true,
}: ReportToolbarProps) => {
  const selectClass = "w-full appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer [&>option]:bg-card [&>option]:text-foreground";
  const rowsSelectClass = "appearance-none border border-border rounded-lg px-3 py-2 text-xs bg-transparent text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer";

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search + Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={searchPlaceholder}
              className="pl-9 h-10 bg-transparent border-border"
            />
          </div>

          <Popover open={showFilters} onOpenChange={onShowFiltersChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-10 text-xs font-medium shrink-0">
                <Filter size={14} />
                Filtrar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4 space-y-4" align="start">
              <h4 className="text-sm font-semibold text-foreground">Filtros</h4>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Representante</label>
                <select
                  value={selectedRepRaw.length === 1 ? selectedRepRaw[0] : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) { onRepChange([val], [Number(val)]); }
                    else { onRepChange([], []); }
                  }}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {representantes.map((r: any) => (
                    <option key={r.rep_codrep} value={r.rep_codrep}>{r.rep_nomrep}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {format(selectedPeriod.startDate, 'dd/MM/yy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={selectedPeriod.startDate} onSelect={(d) => d && onPeriodChange({ ...selectedPeriod, startDate: d })} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {format(selectedPeriod.endDate, 'dd/MM/yy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={selectedPeriod.endDate} onSelect={(d) => d && onPeriodChange({ ...selectedPeriod, endDate: d })} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={onApplyFilters}>Aplicar</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearFilters}>Limpar</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {showOpTabs && (
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              {opTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className={rowsSelectClass}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-medium">
            <Download size={14} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(selectedRepRaw.length > 0 || searchQuery.trim()) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          {selectedRepRaw.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
              Rep: {representantes.find((r: any) => String(r.rep_codrep) === selectedRepRaw[0])?.rep_nomrep || selectedRepRaw[0]}
              <X size={12} className="cursor-pointer hover:text-destructive" onClick={() => onRepChange([], [])} />
            </span>
          )}
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground">
              Busca: {searchQuery}
              <X size={12} className="cursor-pointer hover:text-destructive" onClick={onClearFilters} />
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ReportToolbar.displayName = 'ReportToolbar';
export default ReportToolbar;
