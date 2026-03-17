import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, CalendarIcon, X, Users, UserCheck, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth-refresh';
import type { Representante } from '@/hooks/use-representantes';
import type { SelectedClient } from '@/components/erp/FilterClientPicker';

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

interface FilterPanelProps {
  representantes: Representante[];
  selectedRepRaw: string[];
  setSelectedRepRaw: (v: string[]) => void;
  selectedRep: number[];
  setSelectedRep: (v: number[]) => void;
  selectedClients: SelectedClient[];
  setSelectedClients: (v: SelectedClient[]) => void;
  selectedPeriod: { startDate: Date; endDate: Date };
  setSelectedPeriod: (v: { startDate: any; endDate: any }) => void;
  defaultStartDate: Date;
  defaultEndDate: Date;
  hasActiveFilters: boolean;
  onApply: () => void;
  onClear: () => void;
}

/* ── Section Header ── */
const SectionHeader = ({ icon: Icon, label, badge }: { icon: any; label: string; badge?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2.5">
    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10">
      <Icon size={13} className="text-primary" />
    </div>
    <span className="text-xs font-semibold text-foreground tracking-wide">{label}</span>
    {badge}
  </div>
);

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

  // Count active filters
  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedRepRaw.length > 0) count++;
    if (selectedClients.length > 0) count++;
    const isDefaultPeriod =
      selectedPeriod.startDate.getTime() === defaultStartDate.getTime() &&
      selectedPeriod.endDate.getTime() === defaultEndDate.getTime();
    if (!isDefaultPeriod) count++;
    return count;
  }, [selectedRepRaw, selectedClients, selectedPeriod, defaultStartDate, defaultEndDate]);

  // Derive linked reps from selected clients
  const linkedReps = useMemo(() => {
    if (selectedClients.length === 0) return [];
    const codes = new Set(selectedClients.map(c => c.repCode).filter(Boolean));
    return representantes.filter(r => codes.has(r.rep_codrep));
  }, [selectedClients, representantes]);

  // Fetch clients
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

      <PopoverContent className="w-[420px] p-0 shadow-lg border-border/80" align="start" sideOffset={8}>
        {/* ── Header ── */}
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

        <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* ── REPRESENTANTE ── */}
          <div>
            <SectionHeader
              icon={UserCheck}
              label="Representante"
              badge={selectedRepRaw.length > 0 ? (
                <Badge variant="outline" className="text-[10px] h-5 ml-auto font-medium border-primary/30 text-primary">
                  1 selecionado
                </Badge>
              ) : undefined}
            />

            {selectedClients.length > 0 && linkedReps.length > 0 ? (
              <div className="border border-primary/20 rounded-lg px-3.5 py-3 bg-primary/5 space-y-1">
                <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                  Vinculado ao(s) cliente(s)
                </span>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {linkedReps.map(r => r.rep_nomrep).join(', ')}
                </p>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedRepRaw.length === 1 ? selectedRepRaw[0] : ''}
                  onChange={(e) => selectRep(e.target.value)}
                  className="w-full appearance-none border border-border rounded-lg px-3.5 py-2.5 text-xs bg-card text-foreground h-10 pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="">Todos os representantes</option>
                  {representantes.map((r) => (
                    <option key={r.rep_codrep} value={r.rep_codrep}>{r.rep_nomrep}</option>
                  ))}
                </select>
                {selectedRepRaw.length > 0 && (
                  <button
                    onClick={() => selectRep('')}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-border" />

          {/* ── CLIENTE ── */}
          <div>
            <SectionHeader
              icon={Users}
              label="Cliente"
              badge={selectedClients.length > 0 ? (
                <Badge variant="outline" className="text-[10px] h-5 ml-auto font-medium border-primary/30 text-primary">
                  {selectedClients.length} selecionado{selectedClients.length > 1 ? 's' : ''}
                </Badge>
              ) : selectedRepRaw.length > 0 ? (
                <span className="text-[10px] text-primary/70 ml-auto italic">filtrado pelo representante</span>
              ) : undefined}
            />

            {/* Selected clients */}
            {selectedClients.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="border border-border rounded-lg p-2 max-h-28 overflow-y-auto space-y-0.5">
                  {selectedClients.map(cli => (
                    <div key={cli.code} className="flex items-center justify-between text-xs group py-1 px-1.5 rounded hover:bg-muted/50 transition-colors">
                      <span className="text-foreground truncate mr-2">
                        <span className="text-muted-foreground font-mono text-[10px] mr-1.5">{cli.code}</span>
                        {cli.name}
                      </span>
                      <button
                        onClick={() => setSelectedClients(selectedClients.filter(c => c.code !== cli.code))}
                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedClients([])} className="text-[11px] text-destructive hover:underline font-medium">
                  Limpar seleção
                </button>
              </div>
            )}

            {/* Client search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                onDoubleClick={() => {
                  const repForSearch = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
                  fetchClients('', repForSearch);
                }}
                placeholder="Buscar cliente por nome ou código..."
                className="h-9 text-xs pl-8 pr-3"
              />
              {clientLoading && (
                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ml-0.5">
              Duplo clique para listar todos
            </p>

            {/* Client results */}
            {(showClientResults || (selectedRepRaw.length > 0 && clientResults.length > 0)) && (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto mt-2 bg-card">
                {clientLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 size={16} className="mx-auto text-primary animate-spin mb-1" />
                    <span className="text-[11px] text-muted-foreground">Buscando clientes...</span>
                  </div>
                ) : clientResults.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  clientResults.map(c => {
                    const isSelected = selectedClients.some(s => s.code === c.code);
                    return (
                      <label
                        key={c.code}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors border-b border-border/50 last:border-b-0",
                          isSelected ? "bg-primary/5" : "hover:bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-primary border-primary" : "border-border bg-card"
                        )}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary-foreground">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClient(c)}
                          className="sr-only"
                        />
                        <span className="text-foreground truncate">
                          <span className="text-muted-foreground font-mono text-[10px] mr-1.5">{c.code}</span>
                          {c.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-border" />

          {/* ── PERÍODO ── */}
          <div>
            <SectionHeader icon={CalendarIcon} label="Período" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-0.5">De</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-xs">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                      {format(selectedPeriod.startDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedPeriod.startDate}
                      onSelect={(d) => d && setSelectedPeriod({ startDate: d, endDate: selectedPeriod.endDate })}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-0.5">Até</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-10 text-xs">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                      {format(selectedPeriod.endDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedPeriod.endDate}
                      onSelect={(d) => d && setSelectedPeriod({ startDate: selectedPeriod.startDate, endDate: d })}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
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
