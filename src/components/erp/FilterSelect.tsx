import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, Loader2, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FilterDrawerItem {
  code: string | number;
  name: string;
  subtitle?: string;
}

interface FilterSelectProps {
  items: FilterDrawerItem[];
  loading?: boolean;
  selectedCode: string | number | null;
  onSelect: (item: FilterDrawerItem) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  icon?: React.ReactNode;
}

const FilterSelect = ({
  items,
  loading = false,
  selectedCode,
  onSelect,
  onSearch,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado',
  icon,
}: FilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // External search with debounce
  useEffect(() => {
    if (!open) return;
    if (onSearch) {
      const t = setTimeout(() => onSearch(search), 300);
      return () => clearTimeout(t);
    }
  }, [search, onSearch, open]);

  const filtered = useMemo(() => {
    if (onSearch) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) || String(i.code).includes(q)
    );
  }, [items, search, onSearch]);

  const selectedItem = useMemo(() => {
    if (!selectedCode) return null;
    return items.find(i => String(i.code) === String(selectedCode)) || null;
  }, [items, selectedCode]);

  const handleSelect = (item: FilterDrawerItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-all",
          open
            ? "border-primary/40 ring-2 ring-primary/15 bg-card"
            : "border-border hover:border-primary/30 hover:bg-accent/30 bg-card"
        )}
      >
        {icon && <span className="text-primary/60 shrink-0">{icon}</span>}
        <span className={cn("flex-1 text-left truncate", selectedItem ? "text-foreground font-medium" : "text-muted-foreground")}>
          {selectedItem ? selectedItem.name : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 border border-border rounded-xl bg-card shadow-lg overflow-hidden animate-scale-in">
          {/* Search inside dropdown */}
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 text-xs pl-8 pr-8 bg-muted/40 border-0 rounded-lg focus-visible:ring-1"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list - compact height */}
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 size={16} className="text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Carregando...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map(item => {
                const isActive = String(item.code) === String(selectedCode);
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                      isActive
                        ? "bg-primary/8 text-primary"
                        : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isActive ? <Check size={13} /> : item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("truncate", isActive && "font-semibold")}>{item.name}</p>
                      <p className="text-[10px] text-muted-foreground/70 font-mono">Cód. {item.code}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSelect;
