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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-background px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        R$ {payload[0].value.toLocaleString('pt-BR')}
      </p>
    </div>
  );
};

const SalesChartCard = ({ totalValue }: Props) => {
  const displayTotal = totalValue > 0 ? totalValue : 14094;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-foreground">Venda Mês</h3>
        <p className="text-xs text-muted-foreground">Usuários de todos os canais</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm text-muted-foreground align-super">R$</span>
          <span className="text-4xl font-bold text-foreground">
            {displayTotal.toLocaleString('pt-BR')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mais R$ 48.346 para atingir a meta
        </p>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGreenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="50%" stopColor="#34d399" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
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
              tickFormatter={(v) => `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`}
              width={55}
              domain={[10000, 24000]}
              ticks={[10000, 13500, 17000, 20500, 24000]}
            />
            <ReferenceLine
              y={20500}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 4"
              strokeOpacity={0.4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4', strokeOpacity: 0.5 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#salesGreenFill)"
              dot={false}
              activeDot={{ r: 5, fill: '#34d399', stroke: 'hsl(var(--card))', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartCard;
