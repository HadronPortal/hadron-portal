import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const salesData = [
  { date: 'Abr 04', value: 17000 },
  { date: 'Abr 05', value: 19500 },
  { date: 'Abr 06', value: 19500 },
  { date: 'Abr 07', value: 21000 },
  { date: 'Abr 08', value: 21000 },
  { date: 'Abr 09', value: 18000 },
  { date: 'Abr 10', value: 18000 },
  { date: 'Abr 11', value: 19500 },
  { date: 'Abr 12', value: 19500 },
  { date: 'Abr 13', value: 20000 },
  { date: 'Abr 14', value: 20000 },
  { date: 'Abr 15', value: 18500 },
  { date: 'Abr 16', value: 18500 },
  { date: 'Abr 17', value: 21500 },
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
          <h3 className="text-base font-semibold text-foreground">Ofertas deste mês</h3>
          <p className="text-xs text-muted-foreground">Usuários de todos os canais</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-accent/60 flex items-center justify-center text-muted-foreground hover:bg-accent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm text-muted-foreground align-super">$</span>
          <span className="text-4xl font-bold text-foreground">
            {displayTotal.toLocaleString('pt-BR')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mais US$ 48.346 para atingir a meta
        </p>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGreenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#50cd89" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#50cd89" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`}
              width={50}
              domain={[10000, 24000]}
              ticks={[10000, 13500, 17000, 20500, 24000]}
            />
            <ReferenceLine
              y={20500}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                fontSize: 13,
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              formatter={(v: number) => [
                <span key="v" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#50cd89] inline-block" />
                  <span className="font-semibold">${(v / 1000).toFixed(0)}K</span>
                </span>,
                'Sales',
              ]}
            />
            <Area
              type="step"
              dataKey="value"
              stroke="#50cd89"
              strokeWidth={2.5}
              fill="url(#salesGreenFill)"
              dot={false}
              activeDot={{ r: 5, fill: '#50cd89', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartCard;
