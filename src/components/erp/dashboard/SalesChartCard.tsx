import { useState, useRef, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const allSalesData = [
  { date: 'Abr 01', value: 15500 },
  { date: 'Abr 02', value: 16200 },
  { date: 'Abr 03', value: 18000 },
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
const EDGE_ZONE = 60;
const SCROLL_INTERVAL = 250;

interface Props {
  totalValue: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-background px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        R$ {payload[0].value.toLocaleString('pt-BR')}
      </p>
    </div>
  );
};

const CustomBar = (props: any) => {
  const { x, y, width, height } = props;
  const radius = Math.min(width / 2, 8);
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      fill="url(#barBlueFill)"
    />
  );
};

const SalesChartCard = ({ totalValue }: Props) => {
  const displayTotal = totalValue > 0 ? totalValue : 14094;
  const [startIndex, setStartIndex] = useState(0);
  const scrollDirection = useRef<'left' | 'right' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxStart = allSalesData.length - VISIBLE_COUNT;
  const visibleData = allSalesData.slice(startIndex, startIndex + VISIBLE_COUNT);

  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex < maxStart;

  const stopScrolling = useCallback(() => {
    scrollDirection.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startScrolling = useCallback((dir: 'left' | 'right') => {
    if (scrollDirection.current === dir) return;
    stopScrolling();
    scrollDirection.current = dir;

    const advance = () => {
      setStartIndex(prev => {
        if (dir === 'right') return Math.min(prev + 1, maxStart);
        return Math.max(prev - 1, 0);
      });
    };

    advance();
    intervalRef.current = setInterval(advance, SCROLL_INTERVAL);
  }, [maxStart, stopScrolling]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relX = e.clientX - rect.left;

    if (relX < EDGE_ZONE && canGoLeft) {
      startScrolling('left');
    } else if (relX > rect.width - EDGE_ZONE && canGoRight) {
      startScrolling('right');
    } else {
      stopScrolling();
    }
  }, [canGoLeft, canGoRight, startScrolling, stopScrolling]);

  useEffect(() => {
    return () => stopScrolling();
  }, [stopScrolling]);

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

      <div
        ref={containerRef}
        className="flex-1 min-h-[200px] relative select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={stopScrolling}
      >
        {canGoLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center pointer-events-none bg-gradient-to-r from-card/80 to-transparent">
            <ChevronLeft className="w-4 h-4 text-muted-foreground animate-pulse" />
          </div>
        )}
        {canGoRight && (
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center pointer-events-none bg-gradient-to-l from-card/80 to-transparent">
            <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse" />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barCategoryGap="30%">
            <defs>
              <linearGradient id="barBlueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
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
              domain={[0, 25000]}
              ticks={[0, 5000, 10000, 15000, 20000, 25000]}
            />
            <ReferenceLine
              y={20500}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 4"
              strokeOpacity={0.4}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.05 }}
            />
            <Bar
              dataKey="value"
              shape={<CustomBar />}
              isAnimationActive={false}
              activeBar={{ fillOpacity: 0.9 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartCard;
