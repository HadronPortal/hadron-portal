import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

const salesData = [
  { date: 'Jan 04', value: 14000 },
  { date: 'Jan 07', value: 17500 },
  { date: 'Jan 10', value: 15000 },
  { date: 'Jan 13', value: 20500 },
  { date: 'Jan 16', value: 19000 },
  { date: 'Jan 19', value: 21000 },
  { date: 'Jan 22', value: 18500 },
  { date: 'Jan 25', value: 22000 },
  { date: 'Jan 28', value: 20000 },
  { date: 'Fev 01', value: 21500 },
];

interface Props {
  totalValue: number;
}

const SalesChartCard = ({ totalValue }: Props) => {
  const displayTotal = totalValue > 0 ? totalValue : 14094;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Vendas do Mês</h3>
          <p className="text-xs text-muted-foreground">Todos os canais</p>
        </div>
        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <span className="text-3xl font-bold text-foreground">
            {displayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mais R$48.346 para a meta
        </p>
      </div>

      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="salesGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--erp-green))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--erp-green))" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}K`}
              width={55}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }}
              formatter={(v: number) => [`R$${(v / 1000).toFixed(0)}K`, 'Vendas']}
            />
            <Area
              type="linear"
              dataKey="value"
              stroke="hsl(var(--erp-green))"
              strokeWidth={2.5}
              fill="url(#salesGreen)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartCard;
