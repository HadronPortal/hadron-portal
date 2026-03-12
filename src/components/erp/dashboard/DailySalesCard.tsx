import { BarChart, Bar, ResponsiveContainer } from 'recharts';

const barData = [
  { v: 35 }, { v: 55 }, { v: 45 }, { v: 50 }, { v: 70 }, { v: 55 }, { v: 60 }, { v: 50 },
];

interface Props {
  value: number;
}

const DailySalesCard = ({ value }: Props) => {
  const displayValue = value > 0 ? value : 2420;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <span className="text-3xl font-bold text-foreground">
            {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-emerald-500 ml-2">▲2.6%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Média de Vendas Diárias</p>
      </div>

      <div className="flex-1 flex items-end">
        <div className="w-full h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={4}>
              <Bar dataKey="v" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailySalesCard;
