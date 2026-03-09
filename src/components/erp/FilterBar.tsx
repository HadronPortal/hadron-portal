import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const FilterBar = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 8));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 2, 9));

  const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');

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
              {formatDate(startDate)} | {formatDate(endDate)}
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
        <Select>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="REPRESENTANTES" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="rep1">Representante 1</SelectItem>
            <SelectItem value="rep2">Representante 2</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <Input
          type="text"
          placeholder="Nome Cliente,doc,local"
          className="w-56 h-9 text-sm"
        />

        <div className="flex items-center gap-3 ml-auto">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Limpar
          </button>

          <Button size="sm" className="h-8 px-5 text-xs font-semibold">
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
