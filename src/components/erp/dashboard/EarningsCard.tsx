import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Enviado', value: 7660, color: 'hsl(173, 58%, 39%)', shadowColor: 'hsl(173, 58%, 28%)' },
  { name: 'Aprovado', value: 2820, color: 'hsl(25, 95%, 53%)', shadowColor: 'hsl(25, 95%, 38%)' },
  { name: 'Faturado', value: 45257, color: 'hsl(152, 69%, 31%)', shadowColor: 'hsl(152, 69%, 20%)' },
  { name: 'Cancelado', value: 1230, color: 'hsl(0, 84%, 60%)', shadowColor: 'hsl(0, 84%, 45%)' },
];

const DonutLayer = ({ offset = 0, isShadow = false }: { offset?: number; isShadow?: boolean }) => (
  <div
    className="absolute inset-0"
    style={{ transform: `translateY(${offset}px)`, zIndex: isShadow ? 0 : 1 }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={28}
          outerRadius={42}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={isShadow ? entry.shadowColor : entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
);

const EarningsCard = () => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <span className="text-3xl font-bold text-foreground">
            {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Total</p>
      </div>

      <div className="flex items-center gap-6 flex-1">
        <div className="w-24 h-28 flex-shrink-0 relative">
          {/* 3D shadow layers */}
          <DonutLayer offset={6} isShadow />
          <DonutLayer offset={4} isShadow />
          <DonutLayer offset={2} isShadow />
          {/* Main donut */}
          <DonutLayer offset={0} />
        </div>
        <div className="space-y-2.5 text-sm flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground w-20">{item.name}</span>
              <span className="font-semibold text-foreground tabular-nums text-right ml-auto">
                R${item.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsCard;
