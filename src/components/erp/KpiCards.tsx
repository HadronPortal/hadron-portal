import { TrendingUp, TrendingDown, Send, CheckCircle, FileText, XCircle, Users } from 'lucide-react';

interface KpiCardsProps {
  enviados: number;
  aprovados: number;
  faturados: number;
  cancelados: number;
  clientesPositivados: number;
}

const formatCurrency = (value: number) =>
  'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cards: { key: keyof KpiCardsProps; label: string; sublabel: string; icon: typeof Send; color: string; isCurrency: boolean }[] = [
  { key: 'enviados', label: 'Enviados', sublabel: 'Total no período', icon: Send, color: 'hsl(var(--erp-blue))', isCurrency: true },
  { key: 'aprovados', label: 'Aprovados', sublabel: 'Total no período', icon: CheckCircle, color: 'hsl(var(--erp-green))', isCurrency: true },
  { key: 'faturados', label: 'Faturados', sublabel: 'Total no período', icon: FileText, color: 'hsl(var(--erp-navy))', isCurrency: true },
  { key: 'cancelados', label: 'Cancelados', sublabel: 'Total no período', icon: XCircle, color: 'hsl(var(--destructive))', isCurrency: true },
  { key: 'clientesPositivados', label: 'Positivados', sublabel: 'Clientes ativos', icon: Users, color: 'hsl(var(--erp-amber))', isCurrency: false },
];

const KpiCards = (props: KpiCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(({ key, label, sublabel, icon: Icon, color, isCurrency }) => (
        <div
          key={key}
          className="bg-card border border-border rounded-xl px-5 py-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color + '15' }}
            >
              <Icon size={20} style={{ color }} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {isCurrency ? formatCurrency(props[key]) : props[key]}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          </div>
          <p className="text-xs font-semibold tracking-wide" style={{ color }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
