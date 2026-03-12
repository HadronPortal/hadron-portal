import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

const discountData = [
  { date: 'Jan 04', value: 352 },
  { date: 'Jan 07', value: 358 },
  { date: 'Jan 10', value: 354 },
  { date: 'Jan 13', value: 363 },
  { date: 'Jan 16', value: 356 },
  { date: 'Jan 19', value: 359 },
  { date: 'Jan 22', value: 361 },
  { date: 'Jan 25', value: 355 },
  { date: 'Jan 28', value: 360 },
  { date: 'Fev 01', value: 357 },
];

const DiscountedSalesCard = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Vendas com Desconto</h3>
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
          <span className="text-3xl font-bold text-foreground">3.706,00</span>
          <span className="text-xs font-semibold text-destructive ml-2">▼4.5%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Total de vendas com desconto no mês
        </p>
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={discountData}>
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
              tickFormatter={(v) => `R$${v}`}
              width={50}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DiscountedSalesCard;
