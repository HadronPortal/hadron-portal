import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  enviados: number;
  aprovados: number;
  faturados: number;
  cancelados: number;
}

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground">
        R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({pct}%)
      </p>
    </div>
  );
};

const EarningsCard = ({ enviados, aprovados, faturados, cancelados }: Props) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { name: 'Enviado', value: enviados, color: '#06b6d4', dark: '#0891b2' },
    { name: 'Aprovado', value: aprovados, color: '#f59e0b', dark: '#d97706' },
    { name: 'Faturado', value: faturados, color: '#10b981', dark: '#059669' },
    { name: 'Cancelado', value: cancelados, color: '#ef4444', dark: '#dc2626' },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col h-full overflow-hidden">
      <div className="mb-3 sm:mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">R$</span>
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Total</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 self-center sm:self-auto relative" style={{ perspective: '600px' }}>
          <div
            className="absolute inset-0 opacity-30 blur-[2px]"
            style={{ transform: 'translateY(6px) scale(0.95)' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.dark} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="absolute inset-0 animate-scale-in"
            style={{ transformStyle: 'preserve-3d', transform: 'rotateX(12deg)' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={activeIndex !== null ? 56 : 52}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="rgba(255,255,255,0.3)"
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                      style={{ transition: 'opacity 0.3s ease, filter 0.3s ease', filter: activeIndex === i ? 'brightness(1.15) drop-shadow(0 0 6px ' + entry.color + ')' : 'none', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2.5 text-sm flex-1 w-full min-w-0">
          {data.map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div
                key={item.name}
                className="flex items-center justify-between gap-1.5 sm:gap-2 transition-all duration-200 cursor-default"
                style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.4 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span
                  className="w-[88px] sm:w-24 text-center py-1 rounded-full text-[11px] sm:text-xs font-medium border shrink-0"
                  style={{
                    backgroundColor: item.color + '18',
                    color: item.color,
                    borderColor: item.color + '40',
                  }}
                >
                  {item.name}
                </span>
                <div className="flex flex-col items-end min-w-0">
                  <span className="font-semibold text-foreground tabular-nums whitespace-nowrap text-xs sm:text-sm">
                    R${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EarningsCard;
