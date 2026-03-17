import { useState, useCallback, useMemo, useEffect } from 'react';
import { Filter, X, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth-refresh';
import FilterSelect from '@/components/erp/FilterSelect';
import type { FilterDrawerItem } from '@/components/erp/FilterSelect';
import type { Representante } from '@/hooks/use-representantes';
import type { SelectedClient } from '@/components/erp/FilterClientPicker';

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export interface FilterPanelProps {
  representantes: Representante[];
  selectedRepRaw: string[];
  setSelectedRepRaw: (v: string[]) => void;
  selectedRep: number[];
  setSelectedRep: (v: number[]) => void;
  selectedClients: SelectedClient[];
  setSelectedClients: (v: SelectedClient[]) => void;
  hasActiveFilters: boolean;
  onApply: () => void;
  onClear: () => void;
  hideClientFilter?: boolean;
}

const FilterPanel = ({
  representantes,
  selectedRepRaw,
  setSelectedRepRaw,
  selectedRep,
  setSelectedRep,
  selectedClients,
  setSelectedClients,
  hasActiveFilters,
  onApply,
  onClear,
  hideClientFilter = false,
}: FilterPanelProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [clientResults, setClientResults] = useState<SelectedClient[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedRepRaw.length > 0) count++;
    if (selectedClients.length > 0) count++;
    return count;
  }, [selectedRepRaw, selectedClients]);

  const repItems: FilterDrawerItem[] = useMemo(() =>
    representantes.map(r => ({ code: r.rep_codrep, name: r.rep_nomrep })),
    [representantes]
  );

  const clientItems: FilterDrawerItem[] = useMemo(() => {
    const selectedCodes = new Set(selectedClients.map(c => c.code));
    return clientResults
      .filter(c => !selectedCodes.has(c.code))
      .map(c => ({
        code: c.code,
        name: c.name,
        subtitle: c.repCode ? `Rep. ${c.repCode}` : undefined,
      }));
  }, [clientResults, selectedClients]);

  const fetchClients = useCallback(async (q: string) => {
    setClientLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q.trim()) params.set('search', q.trim());
      if (selectedRepRaw.length > 0) params.set('rep', selectedRepRaw.join(','));
      const res = await fetchWithAuth(`${BASE}/fetch-clients?${params}`);
      if (!res.ok) { setClientResults([]); return; }
      const data = await res.json();
      const clients = (data?.clients || []).map((c: any) => ({
        code: c.ter_codter,
        name: c.ter_nomter,
        repCode: c.COD_REP,
      }));
      setClientResults(clients);
    } catch {
      setClientResults([]);
    } finally {
      setClientLoading(false);
    }
  }, [selectedRepRaw]);

  // Pre-load clients when popover opens
  useEffect(() => {
    if (showFilters) fetchClients('');
  }, [showFilters, fetchClients]);

  const handleSelectRep = (item: FilterDrawerItem) => {
    setSelectedRepRaw([String(item.code)]);
    setSelectedRep([Number(item.code)]);
    setSelectedClients([]);
  };

  const handleClearRep = () => {
    setSelectedRepRaw([]);
    setSelectedRep([]);
  };

  const handleSelectClient = (item: FilterDrawerItem) => {
    const client: SelectedClient = {
      code: item.code as number,
      name: item.name,
      repCode: clientResults.find(c => c.code === item.code)?.repCode,
    };
    const exists = selectedClients.some(c => c.code === client.code);
    if (exists) {
      setSelectedClients(selectedClients.filter(c => c.code !== client.code));
    } else {
      setSelectedClients([...selectedClients, client]);
    }
  };

  const handleApply = () => {
    onApply();
    setShowFilters(false);
  };

  const handleClear = () => {
    onClear();
    setShowFilters(false);
  };

  return (
    <Popover open={showFilters} onOpenChange={setShowFilters}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-1.5 h-10 text-xs font-medium shrink-0 relative",
            hasActiveFilters && "shadow-sm"
          )}
        >
          <Filter size={14} />
          Filtrar
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary-foreground text-primary text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[340px] max-w-[calc(100vw-2rem)] p-0 shadow-lg border-border/80" align="start" sideOffset={8}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between rounded-t-md">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">Filtros</h4>
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold">
                {activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={handleClear} className="text-[11px] text-destructive hover:underline font-medium">
              Limpar tudo
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* REPRESENTANTE */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
              Representante
            </p>
            {selectedRepRaw.length > 0 ? (
              <div className="flex items-center gap-2 border border-primary/20 rounded-xl px-3 py-2 bg-primary/5">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                  {repItems.find(r => String(r.code) === selectedRepRaw[0])?.name.charAt(0).toUpperCase() || 'R'}
                </div>
                <span className="flex-1 text-xs font-medium text-foreground truncate">
                  {repItems.find(r => String(r.code) === selectedRepRaw[0])?.name || `Cód. ${selectedRepRaw[0]}`}
                </span>
                <button
                  onClick={handleClearRep}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <FilterSelect
                items={repItems}
                selectedCode={null}
                onSelect={handleSelectRep}
                placeholder="Todos os representantes"
                searchPlaceholder="Buscar representante..."
                emptyMessage="Nenhum representante encontrado"
                icon={<UserCheck size={14} />}
              />
            )}
          </div>

          <div className="h-px bg-border" />

          {/* CLIENTE */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </p>
              {selectedRepRaw.length > 0 && (
                <span className="text-[10px] text-primary/70 italic">filtrado pelo representante</span>
              )}
            </div>

            {/* Selected clients chips */}
            {selectedClients.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {selectedClients.map(cli => (
                  <div key={cli.code} className="flex items-center gap-2 border border-primary/20 rounded-xl px-3 py-2 bg-primary/5">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                      {cli.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cli.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClients(selectedClients.filter(c => c.code !== cli.code))}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Always show client selector to allow adding more */}
            <FilterSelect
              items={clientItems}
              loading={clientLoading}
              selectedCode={null}
              onSelect={handleSelectClient}
              onSearch={(q) => fetchClients(q)}
              placeholder={selectedClients.length > 0 ? '+ Adicionar cliente' : 'Selecionar cliente'}
              searchPlaceholder="Buscar por nome ou código..."
              emptyMessage="Nenhum cliente encontrado"
              icon={<Users size={14} />}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border bg-muted/30 flex items-center gap-3 rounded-b-md">
          <Button size="sm" className="flex-1 h-10 text-xs font-semibold" onClick={handleApply}>
            Aplicar Filtros
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs px-4" onClick={handleClear}>
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPanel;
