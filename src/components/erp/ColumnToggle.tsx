import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
}

interface ColumnToggleProps {
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  onChange: (visible: Record<string, boolean>) => void;
}

const ColumnToggle = ({ columns, visible, onChange }: ColumnToggleProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key: string) => {
    onChange({ ...visible, [key]: !visible[key] });
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(!open)}>
        Colunas <ChevronDown size={14} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => toggle(col.key)}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer select-none transition-colors ${
                visible[col.key] !== false
                  ? 'text-foreground font-medium bg-accent/30'
                  : 'text-muted-foreground'
              } hover:bg-accent/50`}
            >
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnToggle;
