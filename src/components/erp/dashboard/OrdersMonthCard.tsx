import { Progress } from '@/components/ui/progress';

interface Props {
  ordersCount: number;
}

const OrdersMonthCard = ({ ordersCount }: Props) => {
  const displayCount = ordersCount > 0 ? ordersCount : 1836;
  const goal = 3000;
  const progress = Math.min(Math.round((displayCount / goal) * 100), 100);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {displayCount.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs font-semibold text-destructive">▼2.2%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Pedidos no Mês</p>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{(goal - displayCount).toLocaleString('pt-BR')} para a meta</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>
    </div>
  );
};

export default OrdersMonthCard;
