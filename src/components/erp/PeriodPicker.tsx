import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface PeriodPickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (v: { startDate: Date; endDate: Date }) => void;
}

const PeriodPicker = ({ startDate, endDate, onChange }: PeriodPickerProps) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 px-2 sm:px-3 text-[11px] sm:text-xs font-normal gap-1 sm:gap-1.5 min-w-0 sm:min-w-[120px] justify-start">
            <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            {format(startDate, 'dd/MM/yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(d) => {
              if (d) {
                onChange({ startDate: d, endDate });
                setStartOpen(false);
              }
            }}
            locale={ptBR}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <span className="text-muted-foreground font-medium select-none">—</span>
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 px-3 text-xs font-normal gap-1.5 min-w-[120px] justify-start">
            <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            {format(endDate, 'dd/MM/yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(d) => {
              if (d) {
                onChange({ startDate, endDate: d });
                setEndOpen(false);
              }
            }}
            locale={ptBR}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PeriodPicker;
