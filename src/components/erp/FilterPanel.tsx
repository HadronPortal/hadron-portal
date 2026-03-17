import { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter, X, Users, UserCheck, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth-refresh';
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
}: FilterPanelProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rep' | 'client'>('rep');
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<SelectedClient[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [repSearch, setRepSearch] = useState('');

  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedRepRaw.length > 0) count++;
    if (selectedClients.length > 0) count++;
    return count;
  }, [selectedRepRaw, selectedClients]);

  const linkedReps = useMemo(() => {
    if (selectedClients.length === 0) return [];
    const codes = new Set(selectedClients.map(c => c.repCode).filter(Boolean));
    return representantes.filter(r => codes.has(r.rep_codrep));
  }, [selectedClients, representantes]);

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
    } catch {
      setClientResults([]);
    } finally {
      setClientLoading(false);
    }
  }, []);

  // Auto-fetch clients when rep selected
  useEffect(() => {
    if (selectedRepRaw.length > 0 && selectedClients.length === 0 && activeTab === 'client') {
      fetchClients('', selectedRepRaw.join(','));
    }
  }, [selectedRepRaw, selectedClients.length, fetchClients, activeTab]);

  // When switching to client tab, load clients
  useEffect(() => {
    if (activeTab === 'client' && clientResults.length === 0) {
      const repForSearch = selectedRepRaw.length > 0 ? selectedRepRaw.join(',') : undefined;
      fetchClients('', repForSearch);
    }
  }, [activeTab]);

  // Debounced client search
  useEffect(() => {
    if (clientSearch.trim().length < 2) return;
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

  const selectRep = (code: string, name: string) => {
    if (selectedRepRaw.includes(code)) {
      // Deselect
      setSelectedRepRaw([]);
      setSelectedRep([]);
    } else {
      setSelectedRepRaw([code]);
      setSelectedRep([Number(code)]);
      setSelectedClients([]);
      setClientSearch('');
      setClientResults([]);
    }
  };

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setClientSearch('');
    setRepSearch('');
    setClientResults([]);
    setOpen(false);
  };

  const filteredReps = useMemo(() => {
    if (!repSearch.trim()) return representantes;
    const q = repSearch.toLowerCase();
    return representantes.filter(r =>
      r.rep_nomrep.toLowerCase().includes(q) || String(r.rep_codrep).includes(q)
    );
  }, [representantes, repSearch]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
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
      </SheetTrigger>

      <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-primary" />
              <SheetTitle className="text-sm font-bold">Filtros</SheetTitle>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold">
                  {activeCount}
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <button onClick={handleClear} className="text-[11px] text-destructive hover:underline font-medium">
                Limpar tudo
              </button>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('rep')}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors relative",
              activeTab === 'rep'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              <UserCheck size={13} />
              Representante
              {selectedRepRaw.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
            {activeTab === 'rep' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors relative",
              activeTab === 'client'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Users size={13} />
              Cliente
              {selectedClients.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
            {activeTab === 'client' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Selected items bar */}
        {(selectedRepRaw.length > 0 || selectedClients.length > 0) && (
          <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/10 space-y-1.5">
            {selectedRepRaw.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">Rep:</span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate">
                    {representantes.find(r => String(r.rep_codrep) === selectedRepRaw[0])?.rep_nomrep || selectedRepRaw[0]}
                  </span>
                  <button
                    onClick={() => { setSelectedRepRaw([]); setSelectedRep([]); }}
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            {selectedClients.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''}:
                  </span>
                  <button onClick={() => setSelectedClients([])} className="text-[10px] text-destructive hover:underline font-medium">
                    Remover todos
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClients.map(cli => (
                    <span
                      key={cli.code}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-foreground"
                    >
                      {cli.name.length > 20 ? cli.name.slice(0, 20) + '…' : cli.name}
                      <button
                        onClick={() => setSelectedClients(selectedClients.filter(c => c.code !== cli.code))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Show linked rep when clients selected */}
            {selectedClients.length > 0 && linkedReps.length > 0 && selectedRepRaw.length === 0 && (
              <div className="text-[10px] text-primary/80 italic">
                Rep: {linkedReps.map(r => r.rep_nomrep).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'rep' && (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={repSearch}
                    onChange={e => setRepSearch(e.target.value)}
                    placeholder="Buscar representante..."
                    className="h-9 text-xs pl-8"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filteredReps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Nenhum representante encontrado</div>
                ) : (
                  filteredReps.map(r => {
                    const isSelected = selectedRepRaw.includes(String(r.rep_codrep));
                    return (
                      <button
                        key={r.rep_codrep}
                        onClick={() => selectRep(String(r.rep_codrep), r.rep_nomrep)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/40",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent/50 text-foreground"
                        )}
                      >
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {r.rep_nomrep.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs truncate", isSelected && "font-semibold")}>{r.rep_nomrep}</p>
                          <p className="text-[10px] text-muted-foreground">Cód: {r.rep_codrep}</p>
                        </div>
                        {isSelected && (
                          <X size={14} className="shrink-0 text-primary hover:text-destructive" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'client' && (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente por nome ou código..."
                    className="h-9 text-xs pl-8"
                  />
                  {clientLoading && (
                    <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                  )}
                </div>
                {selectedRepRaw.length > 0 && (
                  <p className="text-[10px] text-primary/70 mt-1.5 ml-0.5 italic">
                    Filtrado pelo representante selecionado
                  </p>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {clientLoading && clientResults.length === 0 ? (
                  <div className="p-6 text-center">
                    <Loader2 size={18} className="mx-auto text-primary animate-spin mb-2" />
                    <span className="text-xs text-muted-foreground">Buscando clientes...</span>
                  </div>
                ) : clientResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  clientResults.map(c => {
                    const isSelected = selectedClients.some(s => s.code === c.code);
                    return (
                      <button
                        key={c.code}
                        onClick={() => toggleClient(c)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/40",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent/50 text-foreground"
                        )}
                      >
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {(c.name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs truncate", isSelected && "font-semibold")}>{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">Cód: {c.code}</p>
                        </div>
                        {isSelected && (
                          <X size={14} className="shrink-0 text-primary hover:text-destructive" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-3">
          <Button size="sm" className="flex-1 h-10 text-xs font-semibold" onClick={handleApply}>
            Aplicar Filtros
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs px-4" onClick={handleClear}>
            Limpar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterPanel;
