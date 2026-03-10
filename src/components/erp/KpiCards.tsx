interface KpiCardsProps {
  enviados: number;
  aprovados: number;
  faturados: number;
  cancelados: number;
  clientesPositivados: number;
}

const formatCurrency = (value: number) =>
  'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cards: { key: keyof KpiCardsProps; label: string; color: string; isCurrency: boolean }[] = [
  { key: 'enviados', label: 'ENVIADOS', color: 'hsl(var(--erp-blue))', isCurrency: true },
  { key: 'aprovados', label: 'APROVADOS', color: 'hsl(var(--erp-green))', isCurrency: true },
  { key: 'faturados', label: 'FATURADOS', color: 'hsl(var(--erp-navy))', isCurrency: true },
  { key: 'cancelados', label: 'CANCELADOS', color: 'hsl(var(--destructive))', isCurrency: true },
  { key: 'clientesPositivados', label: 'POSITIVADOS', color: 'hsl(var(--erp-amber))', isCurrency: false },
];

const KpiCards = (props: KpiCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(({ key, label, color, isCurrency }) => (
        <div
          key={key}
          className="bg-card border border-border rounded-lg px-5 py-4"
        >
          <p className="text-xs font-semibold tracking-wide mb-1" style={{ color }}>
            {label}
          </p>
          <p className="text-xl font-bold text-foreground">
            {isCurrency ? formatCurrency(props[key]) : props[key]}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
