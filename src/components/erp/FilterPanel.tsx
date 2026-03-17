import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, CalendarIcon, X, Users, UserCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth-refresh';
import type { Representante } from '@/hooks/use-representantes';

export interface FilterClient {
  code: number;
  name: string;
  repCode?: number;
}

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

interface FilterPanelProps {
  representantes: Representante[];
  selectedRepRaw: string[];
  setSelectedRepRaw: (v: string[]) => void;
  selectedRep: number[];
  setSelectedRep: (v: number[]) => void;
  selectedClients: FilterClient[];
  setSelectedClients: (v: FilterClient[]) => void;
  selectedPeriod: { startDate: Date; endDate: Date };
  setSelectedPeriod: (v: { startDate: any; endDate: any }) => void;
  defaultStartDate: Date;
  defaultEndDate: Date;
  hasActiveFilters: boolean;
  onApply: () => void;
  onClear: () => void;
}

const FilterPanel = ({
  representantes,
  selectedRepRaw,
  setSelectedRepRaw,
  selectedRep,
  setSelectedRep,
  selectedClients,
  setSelectedClients,
  selectedPeriod,
  setSelectedPeriod,
  defaultStartDate,
  defaultEndDate,
  hasActiveFilters,
  onApply,
  onClear,
}: FilterPanelProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<SelectedClient[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [showClientResults, setShowClientResults] = useState(false);
  const [activeSection, setActiveSection] = useState<'rep' | 'client' | null>(null);

  // Derive linked reps from selected clients
  const linkedReps = useMemo(() => {
    if (selectedClients.length === 0) return [];
    const codes = new Set(selectedClients.map(c => c.repCode).filter(Boolean));
    return representantes.filter(r => codes.has(r.rep_codrep));
  }, [selectedClients, representantes]);

  // Derive linked clients info text from selected rep
  const linkedFromRep = selectedRepRaw.length > 0 && selectedClients.length === 0;

  // Fetch clients (for search or for rep-linked)
  const fetchClients = useCallback(async (q: string, repCode?: string) => {
    setClientLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q.trim()) params.set('search', q.trim());
      if (repCode) params.set('rep', repCode);
      const res = await fetchWithAuth(`${BASE}/fetch-clients?${params}`);
      if (!res.ok) { setClientResults([]); return; }
      const data = await res.json();
      const clients = (data?.clients || []).map((c: any) => ({
        code: c.ter_codter,
        name: c.ter_nomter,
        repCode: c.COD_REP,
      }));
      setClientResults(clients);
      setShowClientResults(true);
    } catch {
      setClientResults([]);
    } finally {
      setClientLoading(false);
    }
  }, []);

  // When rep is selected, auto-fetch their clients
  useEffect(() => {
    if (selectedRepRaw.length > 0 && selectedClients.length === 0) {
      fetchClients('', selectedRepRaw.join(','));
    }
  }, [selectedRepRaw, selectedClients.length, fetchClients]);

  // Debounced client search
  useEffect(() => {
    if (clientSearch.trim().length < 2) {
      if (clientSearch.trim().length === 0) setShowClientResults(selectedRepRaw.length > 0);
      return;
    }
    const repForSearch = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
    const t = setTimeout(() => fetchClients(clientSearch, repForSearch), 300);
    return () => clearTimeout(t);
  }, [clientSearch, selectedRepRaw, fetchClients]);

  const toggleClient = (client: SelectedClient) => {
    const exists = selectedClients.some(c => c.code === client.code);
    if (exists) {
      setSelectedClients(selectedClients.filter(c => c.code !== client.code));
    } else {
      setSelectedClients([...selectedClients, client]);
    }
  };

  const selectRep = (code: string) => {
    if (code) {
      setSelectedRepRaw([code]);
      setSelectedRep([Number(code)]);
      // Clear client selection when changing rep
      setSelectedClients([]);
      setClientSearch('');
    } else {
      setSelectedRepRaw([]);
      setSelectedRep([]);
    }
  };

  const handleApply = () => {
    onApply();
    setShowFilters(false);
  };

  const handleClear = () => {
    onClear();
    setClientSearch('');
    setClientResults([]);
    setShowClientResults(false);
    setShowFilters(false);
  };

  const handleClientDoubleClick = () => {
    const repForSearch = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
    fetchClients('', repForSearch);
  };

  const selectedRepName = useMemo(() => {
    if (selectedRepRaw.length === 0) return '';
    const rep = representantes.find(r => String(r.rep_codrep) === selectedRepRaw[0]);
    return rep?.rep_nomrep || selectedRepRaw[0];
  }, [selectedRepRaw, representantes]);

  return (
    <Popover open={showFilters} onOpenChange={setShowFilters}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-1.5 h-10 text-xs font-medium shrink-0",
            hasActiveFilters && "border-primary shadow-sm"
          )}
        >
          <Filter size={14} />
          Filtrar
          {hasActiveFilters && (
            <span className="ml-0.5 h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Filtros</h4>
          {hasActiveFilters && (
            <button onClick={handleClear} className="text-[11px] text-destructive hover:underline">
              Limpar tudo
            </button>
          )}
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* ── REPRESENTANTE ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <UserCheck size={13} className="text-muted-foreground" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Representante</label>
            </div>

            {/* If clients are selected, show read-only rep names */}
            {selectedClients.length > 0 && linkedReps.length > 0 ? (
              <div className="border border-primary/20 rounded-lg px-3 py-2.5 text-xs text-foreground bg-primary/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-primary font-medium">Vinculado aos clientes selecionados</span>
                </div>
                <span className="font-medium">{linkedReps.map(r => r.rep_nomrep).join(', ')}</span>
              </div>
            ) : (
              <select
                value={selectedRepRaw.length === 1 ? selectedRepRaw[0] : ''}
                onChange={(e) => selectRep(e.target.value)}
                className="w-full appearance-none border border-border rounded-lg px-3 py-2.5 text-xs bg-card text-foreground h-9 pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_6px_center] bg-no-repeat cursor-pointer focus:ring-1 focus:ring-primary/30 transition-colors [&>option]:bg-card [&>option]:text-foreground"
              >
                <option value="">Todos os representantes</option>
                {representantes.map((r) => (
                  <option key={r.rep_codrep} value={r.rep_codrep}>{r.rep_nomrep}</option>
                ))}
              </select>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* ── CLIENTE ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-muted-foreground" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</label>
              {selectedRepRaw.length > 0 && selectedClients.length === 0 && (
                <span className="text-[10px] text-primary/70 ml-auto">do representante selecionado</span>
              )}
            </div>

            {/* Selected clients chips */}
            {selectedClients.length > 0 && (
              <div className="space-y-1.5">
                <div className="border border-border rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
                  {selectedClients.map(cli => (
                    <div key={cli.code} className="flex items-center justify-between text-xs group">
                      <span className="text-foreground truncate mr-2">
                        <span className="text-muted-foreground font-mono mr-1">{cli.code}</span>
                        {cli.name}
                      </span>
                      <button
                        onClick={() => setSelectedClients(selectedClients.filter(c => c.code !== cli.code))}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedClients([])} className="text-[11px] text-destructive hover:underline">
                  Limpar seleção
                </button>
              </div>
            )}

            {/* Client search */}
            <div className="relative">
              <Input
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onDoubleClick={handleClientDoubleClick}
                placeholder="Buscar cliente... (2x clique p/ todos)"
                className="h-8 text-xs"
              />
            </div>

            {/* Client results */}
            {(showClientResults || (selectedRepRaw.length > 0 && clientResults.length > 0)) && (
              <div className="border border-border rounded-lg max-h-36 overflow-y-auto">
                {clientLoading ? (
                  <div className="p-2 text-center text-[11px] text-muted-foreground">Buscando...</div>
                ) : clientResults.length === 0 ? (
                  <div className="p-2 text-center text-[11px] text-muted-foreground">Nenhum encontrado</div>
                ) : (
                  clientResults.map(c => {
                    const isSelected = selectedClients.some(s => s.code === c.code);
                    return (
                      <label
                        key={c.code}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClient(c)}
                          className="h-3.5 w-3.5 rounded border-border accent-primary"
                        />
                        <span className="text-foreground truncate">
                          <span className="text-muted-foreground font-mono mr-1">{c.code}</span>
                          {c.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* ── PERÍODO ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={13} className="text-muted-foreground" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Período</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(selectedPeriod.startDate, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedPeriod.startDate}
                    onSelect={(d) => d && setSelectedPeriod({ startDate: d, endDate: selectedPeriod.endDate })}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(selectedPeriod.endDate, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedPeriod.endDate}
                    onSelect={(d) => d && setSelectedPeriod({ startDate: selectedPeriod.startDate, endDate: d })}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2 bg-muted/30">
          <Button size="sm" className="flex-1 h-9 text-xs font-medium" onClick={handleApply}>
            Aplicar Filtros
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={handleClear}>
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPanel;
