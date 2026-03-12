import { useState, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const allSalesData = [
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
  { date: 'Abr 18', value: 22000 },
  { date: 'Abr 19', value: 19000 },
  { date: 'Abr 20', value: 20500 },
  { date: 'Abr 21', value: 23000 },
  { date: 'Abr 22', value: 21000 },
  { date: 'Abr 23', value: 19500 },
  { date: 'Abr 24', value: 22500 },
  { date: 'Abr 25', value: 24000 },
  { date: 'Abr 26', value: 20000 },
  { date: 'Abr 27', value: 18500 },
  { date: 'Abr 28', value: 21500 },
  { date: 'Abr 29', value: 23500 },
  { date: 'Abr 30', value: 22000 },
];

const VISIBLE_COUNT = 14;

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
  const [startIndex, setStartIndex] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const visibleData = allSalesData.slice(startIndex, startIndex + VISIBLE_COUNT);
  const maxStart = allSalesData.length - VISIBLE_COUNT;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diff = lastX.current - e.clientX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        setStartIndex(prev => Math.min(prev + 1, maxStart));
      } else {
        setStartIndex(prev => Math.max(prev - 1, 0));
      }
      lastX.current = e.clientX;
    }
  }, [maxStart]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaX > 0 || e.deltaY > 0) {
      setStartIndex(prev => Math.min(prev + 1, maxStart));
    } else {
      setStartIndex(prev => Math.max(prev - 1, 0));
    }
  }, [maxStart]);

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

      {/* Scroll indicator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] text-muted-foreground">
          {startIndex > 0 ? '← arraste' : ''}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {startIndex < maxStart ? 'arraste →' : ''}
        </span>
      </div>

      <div
        className="flex-1 min-h-[200px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartCard;
