import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth-refresh';

export interface SelectedClient {
  code: number;
  name: string;
  repCode?: number;
}

interface FilterClientPickerProps {
  selectedClients: SelectedClient[];
  onChangeClients: (clients: SelectedClient[]) => void;
}

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const FilterClientPicker = ({ selectedClients, onChangeClients }: FilterClientPickerProps) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SelectedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchClients = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '30' });
      if (q.trim()) params.set('search', q.trim());
      const res = await fetchWithAuth(`${BASE}/fetch-clients?${params}`);
      if (!res.ok) { setResults([]); return; }
      const data = await res.json();
      const clients = (data?.clients || []).map((c: any) => ({
        code: c.ter_codter,
        name: c.ter_nomter,
        repCode: c.COD_REP,
      }));
      setResults(clients);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      if (search.trim().length === 0) setShowResults(false);
      return;
    }
    const t = setTimeout(() => fetchClients(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchClients]);

  const handleDoubleClick = () => {
    fetchClients('');
  };

  const toggleClient = (client: SelectedClient) => {
    const exists = selectedClients.some(c => c.code === client.code);
    if (exists) {
      onChangeClients(selectedClients.filter(c => c.code !== client.code));
    } else {
      onChangeClients([...selectedClients, client]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Cliente</label>
      {selectedClients.length > 0 && (
        <div className="space-y-1.5">
          <div className="border border-border rounded-lg p-2 max-h-24 overflow-y-auto space-y-1">
            {selectedClients.map(cli => (
              <div key={cli.code} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate mr-2">{cli.name}</span>
                <button
                  onClick={() => onChangeClients(selectedClients.filter(c => c.code !== cli.code))}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => onChangeClients([])} className="text-[11px] text-destructive hover:underline">
            Limpar todos
          </button>
        </div>
      )}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onDoubleClick={handleDoubleClick}
          placeholder="Buscar cliente... (2x clique p/ todos)"
          className="pl-8 h-8 text-xs"
        />
      </div>
      {showResults && (
        <div className="border border-border rounded-lg max-h-32 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-center text-[11px] text-muted-foreground">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-muted-foreground">Nenhum encontrado</div>
          ) : (
            results.map(c => {
              const isSelected = selectedClients.some(s => s.code === c.code);
              return (
                <label
                  key={c.code}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleClient(c)}
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  <span className="text-foreground truncate">{c.code} — {c.name}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FilterClientPicker;
