import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Enviados', value: 7660, color: 'hsl(340, 80%, 55%)' },
  { name: 'Aprovados', value: 2820, color: 'hsl(220, 70%, 50%)' },
  { name: 'Outros', value: 45257, color: 'hsl(220, 10%, 85%)' },
];

interface Props {
  totalValue: number;
}

const EarningsCard = ({ totalValue }: Props) => {
  const displayValue = totalValue > 0 ? totalValue : 69700;

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
        <div className="space-y-2.5 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-semibold text-foreground ml-auto">
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
