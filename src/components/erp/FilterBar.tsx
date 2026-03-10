import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

interface FilterBarProps {
  representantes?: Representante[];
  clientCountByRep?: Record<number, number>;
  onRepChange?: (repCodes: number[]) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: { startDate: Date; endDate: Date; repCodes: number[]; search: string }) => void;
  onClear?: () => void;
}

const FilterBar = ({ representantes = [], clientCountByRep = {}, onRepChange, onSearch, onFilter, onClear }: FilterBarProps) => {
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 8));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 2, 9));
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [search, setSearch] = useState('');

  const formatDateStr = (date: Date) => format(date, 'dd/MM/yyyy');

  const handleRepChange = (value: string) => {
    setSelectedRep(value);
    const repCodes = value === 'all' ? [] : [Number(value)];
    onRepChange?.(repCodes);
  };

  const handleFilter = () => {
    const repCodes = selectedRep === 'all' ? [] : [Number(selectedRep)];
    onFilter?.({ startDate, endDate, repCodes, search });
  };

  const handleClear = () => {
    setSelectedRep('all');
    setSearch('');
    setStartDate(new Date(2026, 0, 8));
    setEndDate(new Date(2026, 2, 9));
    onClear?.();
  };

  return (
    <div className="bg-transparent border-b border-border px-6 py-2.5">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Period with calendar popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-56 h-9 text-sm justify-start font-normal"
            >
              {formatDateStr(startDate)} | {formatDateStr(endDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex gap-0">
              <div className="border-r border-border p-2">
                <p className="text-xs text-muted-foreground text-center mb-1">Data Inicial</p>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground text-center mb-1">Data Final</p>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => d && setEndDate(d)}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Representantes */}
        <Select value={selectedRep} onValueChange={handleRepChange}>
          <SelectTrigger className="w-56 h-9 text-sm">
            <SelectValue placeholder="REPRESENTANTES" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Representantes</SelectItem>
            {representantes.map((rep) => (
              <SelectItem key={rep.rep_codrep} value={String(rep.rep_codrep)}>
                {rep.rep_codrep}-{rep.rep_nomrep} ({clientCountByRep[rep.rep_codrep] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <Input
          type="text"
          placeholder="Nome Cliente, doc, local"
          className="w-56 h-9 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); onSearch?.(e.target.value); }}
        />

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar
          </button>

          <Button size="sm" className="h-8 px-5 text-xs font-semibold bg-erp-navy hover:bg-erp-navy/90" onClick={handleFilter}>
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
