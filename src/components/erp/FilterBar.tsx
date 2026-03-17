import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';
import { useSessionState } from '@/hooks/use-session-state';

export interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

interface FilterBarProps {
  representantes?: Representante[];
  clientCountByRep?: Record<number, number>;
  onRepChange?: (repCodes: number[]) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => void;
  onClear?: () => void;
  /** Unique key prefix for persisting this filter's state */
  persistKey?: string;
}

const FilterBar = memo(({ representantes = [], clientCountByRep = {}, onRepChange, onSearch, onFilter, onClear, persistKey = 'filterbar' }: FilterBarProps) => {
  const [startDateStr, setStartDateStr] = useSessionState<string>(`${persistKey}_startDate`, new Date(2026, 0, 8).toISOString());
  const [endDateStr, setEndDateStr] = useSessionState<string>(`${persistKey}_endDate`, new Date(2026, 2, 9).toISOString());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useSessionState<string>(`${persistKey}_rep`, 'all');
  const [search, setSearch] = useSessionState<string>(`${persistKey}_search`, '');
  const [open, setOpen] = useState(false);
  
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const setStartDate = (d: Date) => setStartDateStr(d.toISOString());
  const setEndDate = (d: Date) => setEndDateStr(d.toISOString());

  // Auto-apply persisted filters on mount
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // If there are persisted non-default values, auto-apply
      const hasPersistedFilters = selectedRep !== 'all' || search !== '';
      if (hasPersistedFilters && onFilter) {
        const repCodesRaw = selectedRep === 'all' ? [] : [selectedRep];
        const repCodes = repCodesRaw.map(Number);
        onFilter({ startDate, endDate, repCodes, repCodesRaw, search });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateStr = (date: Date) => format(date, 'dd/MM/yyyy');

  const handleRepChange = useCallback((value: string) => {
    setSelectedRep(value);
  }, []);

  const handleFilter = useCallback(() => {
    const repCodesRaw = selectedRep === 'all' ? [] : [selectedRep];
    const repCodes = repCodesRaw.map(Number);
    onFilter?.({ startDate, endDate, repCodes, repCodesRaw, search });
    setOpen(false);
  }, [selectedRep, startDate, endDate, search, onFilter]);

  const handleClear = useCallback(() => {
    setSelectedRep('all');
    setSearch('');
    setStartDate(new Date(2026, 0, 8));
    setEndDate(new Date(2026, 2, 9));
    onClear?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClear]);

  // Debounce: auto-filter on search typing
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const repCodesRaw = selectedRep === 'all' ? [] : [selectedRep];
      const repCodes = repCodesRaw.map(Number);
      onFilter?.({ startDate, endDate, repCodes, repCodesRaw, search });
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasActiveFilters = selectedRep !== 'all' || search.trim() !== '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5",
            hasActiveFilters
              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "bg-primary/90 border-primary/20 text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
        >
          <Filter size={14} />
          Filtro
          {hasActiveFilters && (
            <span className="ml-0.5 w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
        <div className="px-5 py-4 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Opções de filtro</h4>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Representante / Status */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Representante:</label>
            <Select value={selectedRep} onValueChange={handleRepChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione a opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {representantes.map((rep) => (
                  <SelectItem key={rep.rep_codrep} value={String(rep.rep_codrep)}>
                    {rep.rep_codrep}-{rep.rep_nomrep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Período:</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-9 text-sm justify-start font-normal">
                  {formatDateStr(startDate)} — {formatDateStr(endDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="left">
                <div className="flex flex-col sm:flex-row gap-0">
                  <div className="border-b sm:border-b-0 sm:border-r border-border p-2">
                    <p className="text-xs text-muted-foreground text-center mb-1">Data Inicial</p>
                    <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground text-center mb-1">Data Final</p>
                    <Calendar mode="single" selected={endDate} onSelect={(d) => { if (d) { setEndDate(d); setCalendarOpen(false); } }} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Busca */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Busca:</label>
            <Input
              type="text"
              placeholder="Nome, documento, local..."
              className="h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleClear}>
            Reiniciar
          </Button>
          <Button size="sm" className="text-xs px-5" onClick={handleFilter}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

FilterBar.displayName = 'FilterBar';

export default FilterBar;
