import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

const FilterBar = () => {
  return (
    <div className="bg-card border-b border-border px-6 py-2.5">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Period - single field */}
        <Input
          type="text"
          className="w-56 h-9 text-sm border-border"
          defaultValue="08/01/2026 | 09/03/2026"
        />

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
          {/* User */}
          <div className="flex items-center gap-2 text-sm text-foreground">
            <User size={16} className="text-muted-foreground" />
            <span className="font-medium text-xs">3-SUPERVISOR REGIAO 1</span>
          </div>

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
