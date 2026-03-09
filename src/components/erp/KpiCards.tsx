import { Card, CardContent } from '@/components/ui/card';
import { Send, CheckCircle, FileText, Users } from 'lucide-react';

interface KpiCardsProps {
  enviados: number;
  aprovados: number;
  faturados: number;
  clientesPositivados: number;
}

const cards = [
  { key: 'enviados' as const, label: 'ENVIADOS', icon: Send, color: 'hsl(var(--erp-blue))' },
  { key: 'aprovados' as const, label: 'APROVADOS', icon: CheckCircle, color: 'hsl(var(--erp-green))' },
  { key: 'faturados' as const, label: 'FATURADOS', icon: FileText, color: 'hsl(var(--erp-navy))' },
  { key: 'clientesPositivados' as const, label: 'CLIENTES POSITIVADOS', icon: Users, color: 'hsl(var(--erp-amber))' },
];

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const KpiCards = ({ enviados, aprovados, faturados, clientesPositivados }: KpiCardsProps) => {
  const values = { enviados, aprovados, faturados, clientesPositivados };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card
          key={key}
          className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
          <CardContent className="p-4 pl-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color }}>
                  {key === 'clientesPositivados'
                    ? values[key]
                    : formatCurrency(values[key])}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center opacity-20"
                style={{ backgroundColor: color }}
              >
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;
