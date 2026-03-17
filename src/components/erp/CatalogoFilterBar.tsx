import { useState, useRef, useEffect } from 'react';
import { Filter, ArrowUpDown, X, ChevronDown, Search, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CatalogoFilters {
  skuFrom: string;
  skuTo: string;
  priceMin: string;
  priceMax: string;
  category: string;
  stockFilter: 'all' | 'in_stock' | 'out_of_stock';
  sortField: 'sku' | 'price' | 'name' | 'stock';
  sortDir: 'asc' | 'desc';
}

export const defaultFilters: CatalogoFilters = {
  skuFrom: '',
  skuTo: '',
  priceMin: '',
  priceMax: '',
  category: '',
  stockFilter: 'all',
  sortField: 'sku',
  sortDir: 'asc',
};

interface Props {
  filters: CatalogoFilters;
  onChange: (f: CatalogoFilters) => void;
  categories: string[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onExport?: (format: 'pdf' | 'csv' | 'xlsx') => void;
}

const CatalogoFilterBar = ({ filters, onChange, categories, searchQuery, onSearchChange, onExport }: Props) => {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (partial: Partial<CatalogoFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.skuFrom || filters.skuTo || filters.priceMin || filters.priceMax ||
    filters.category || filters.stockFilter !== 'all';

  const clearFilters = () => onChange({ ...defaultFilters, sortField: filters.sortField, sortDir: filters.sortDir });

  const selectClass = "appearance-none border border-border rounded-lg pl-3 pr-7 py-1.5 text-sm bg-card text-foreground h-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer";

  const inputClass = "h-9 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Search + Toggle row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Search input */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Export dropdown */}
        {onExport && (
          <div className="relative shrink-0" ref={exportRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-sm"
              onClick={() => setExportOpen(!exportOpen)}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                <button
                  onClick={() => { onExport('pdf'); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  PDF
                </button>
                <button
                  onClick={() => { onExport('csv'); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <File className="w-4 h-4 text-green-500" />
                  CSV
                </button>
                <button
                  onClick={() => { onExport('xlsx'); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  XLSX
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sort controls - always visible */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <select
            value={filters.sortField}
            onChange={(e) => update({ sortField: e.target.value as CatalogoFilters['sortField'] })}
            className={selectClass}
          >
            <option value="sku">SKU</option>
            <option value="name">Nome</option>
            <option value="price">Preço</option>
            <option value="stock">Estoque</option>
          </select>
          <button
            onClick={() => update({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
            className="h-9 px-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
          >
            {filters.sortDir === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
          </button>
        </div>
      </div>

      {/* Collapsible filter fields */}
      {open && (
        <div className="border-t border-border px-3 sm:px-4 pb-3 sm:pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* SKU range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">SKU de</label>
              <input
                type="number"
                placeholder="Ex: 100"
                value={filters.skuFrom}
                onChange={(e) => update({ skuFrom: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">SKU até</label>
              <input
                type="number"
                placeholder="Ex: 999"
                value={filters.skuTo}
                onChange={(e) => update({ skuTo: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Price range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço mín.</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={filters.priceMin}
                onChange={(e) => update({ priceMin: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço máx.</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$ 999,00"
                value={filters.priceMax}
                onChange={(e) => update({ priceMax: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
              <select
                value={filters.category}
                onChange={(e) => update({ category: e.target.value })}
                className={`${selectClass} w-full`}
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock filter + clear */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Estoque:</label>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                {([['all', 'Todos'], ['in_stock', 'Em estoque'], ['out_of_stock', 'Sem estoque']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => update({ stockFilter: val })}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      filters.stockFilter === val
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-muted-foreground">
                <X className="w-3 h-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoFilterBar;
