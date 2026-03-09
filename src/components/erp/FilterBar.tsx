import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

const FilterBar = () => {
  return (
    <div className="bg-card border-b border-border px-4 md:px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Período</label>
          <Input
            type="text"
            placeholder="08/01/2026"
            className="w-28 h-8 text-xs"
            defaultValue="08/01/2026"
          />
          <span className="text-muted-foreground text-xs">|</span>
          <Input
            type="text"
            placeholder="09/03/2026"
            className="w-28 h-8 text-xs"
            defaultValue="09/03/2026"
          />
        </div>

        {/* Representantes */}
        <Select>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Representantes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="rep1">Representante 1</SelectItem>
            <SelectItem value="rep2">Representante 2</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nome cliente, documento ou local"
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* User */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground">
            S1
          </div>
          <span>Supervisor Região 1</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            <X size={12} /> Limpar
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1">
            <Filter size={12} /> Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
