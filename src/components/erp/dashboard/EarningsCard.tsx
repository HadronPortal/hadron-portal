import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Enviado', value: 7660, color: 'hsl(173, 58%, 39%)' },
  { name: 'Aprovado', value: 2820, color: 'hsl(25, 95%, 53%)' },
  { name: 'Faturado', value: 45257, color: 'hsl(152, 69%, 31%)' },
  { name: 'Cancelado', value: 1230, color: 'hsl(0, 84%, 60%)' },
];

interface Props {
  totalValue: number;
}

const EarningsCard = ({ totalValue }: Props) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const displayValue = totalValue > 0 ? totalValue : total;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <span className="text-3xl font-bold text-foreground">
            {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-emerald-500 ml-2">▲2.2%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Faturamento Esperado</p>
      </div>

      <div className="flex items-center gap-6 flex-1">
        <div className="w-24 h-24 flex-shrink-0">
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
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
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
