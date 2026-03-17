import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface FilterDrawerItem {
  code: string | number;
  name: string;
  subtitle?: string;
}

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: React.ReactNode;
  items: FilterDrawerItem[];
  loading?: boolean;
  selectedCode: string | number | null;
  onSelect: (item: FilterDrawerItem) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const FilterDrawer = ({
  open,
  onOpenChange,
  title,
  icon,
  items,
  loading = false,
  selectedCode,
  onSelect,
  onSearch,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado',
}: FilterDrawerProps) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    if (onSearch) {
      const t = setTimeout(() => onSearch(search), 300);
      return () => clearTimeout(t);
    }
  }, [search, onSearch]);

  // Local filter when no external search handler
  const filtered = onSearch
    ? items
    : items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        String(i.code).includes(search)
      );

  const handleSelect = (item: FilterDrawerItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-[340px] max-w-[85vw] p-0 flex flex-col gap-0 border-l border-border",
          "sm:w-[380px]"
        )}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
            <SheetTitle className="text-base font-bold text-foreground">
              {title}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 text-sm pl-9 pr-9 bg-muted/50 border-border/60 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 size={22} className="text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-1">
              <Search size={28} className="text-muted-foreground/40 mb-2" />
              <span className="text-sm text-muted-foreground">{emptyMessage}</span>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(item => {
                const isActive = String(item.code) === String(selectedCode);
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150",
                      isActive
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-accent/60"
                    )}
                  >
                    {/* Avatar circle */}
                    <div className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-full text-xs font-bold shrink-0 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isActive ? (
                        <Check size={16} />
                      ) : (
                        item.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isActive ? "font-semibold text-primary" : "font-medium text-foreground"
                      )}>
                        {item.name}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 font-mono">
                        Cód. {item.code}
                      </p>
                    </div>

                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
