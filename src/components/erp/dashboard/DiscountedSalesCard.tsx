import { BarChart, Bar, ResponsiveContainer } from 'recharts';

const discountData = [
  { v: 40 }, { v: 55 }, { v: 48 }, { v: 65 }, { v: 50 }, { v: 60 }, { v: 45 }, { v: 58 },
];

const DiscountedSalesCard = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Vendas com Desconto</h3>
          <p className="text-xs text-muted-foreground">Todos os canais</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-accent/60 flex items-center justify-center text-muted-foreground hover:bg-accent">
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

      <div className="flex-1 flex items-end min-h-[120px]">
        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={discountData} barGap={6} barCategoryGap="20%">
              <Bar dataKey="v" fill="hsl(var(--erp-green))" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DiscountedSalesCard;
