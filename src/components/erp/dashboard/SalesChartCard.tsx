import { useState, useRef, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VISIBLE_COUNT = 14;
const EDGE_ZONE = 60;
const SCROLL_INTERVAL = 250;

interface SalesDataPoint {
  date: string;
  value: number;
}

interface Props {
  totalValue: number;
  salesData?: SalesDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-background px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

const CustomBar = (props: any) => {
  const { x, y, width, height } = props;
  const radius = Math.min(width / 2, 8);
  return (
    <rect x={x} y={y} width={width} height={height} rx={radius} ry={radius} fill="url(#barBlueFill)" />
  );
};

const SalesChartCard = ({ totalValue, salesData = [] }: Props) => {
  const [startIndex, setStartIndex] = useState(0);
  const scrollDirection = useRef<'left' | 'right' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allData = salesData.length > 0 ? salesData : [];
  const maxStart = Math.max(allData.length - VISIBLE_COUNT, 0);
  const visibleData = allData.slice(startIndex, startIndex + VISIBLE_COUNT);

  const maxValue = allData.length > 0 ? Math.max(...allData.map(d => d.value)) : 0;
  const yDomain = [0, Math.ceil(maxValue * 1.2 / 100) * 100 || 1000];

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
      setStartIndex(prev => dir === 'right' ? Math.min(prev + 1, maxStart) : Math.max(prev - 1, 0));
    };
    advance();
    intervalRef.current = setInterval(advance, SCROLL_INTERVAL);
  }, [maxStart, stopScrolling]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left;
    if (relX < EDGE_ZONE && canGoLeft) startScrolling('left');
    else if (relX > rect.width - EDGE_ZONE && canGoRight) startScrolling('right');
    else stopScrolling();
  }, [canGoLeft, canGoRight, startScrolling, stopScrolling]);

  useEffect(() => () => stopScrolling(), [stopScrolling]);

  // Start showing last entries
  useEffect(() => {
    if (allData.length > VISIBLE_COUNT) {
      setStartIndex(Math.max(allData.length - VISIBLE_COUNT, 0));
    }
  }, [allData.length]);

  const formatYAxis = (v: number) => {
    if (v >= 1000) return `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
    return `R$${v}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-foreground">Venda Mês</h3>
        <p className="text-xs text-muted-foreground">Evolução de vendas por dia</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm text-muted-foreground align-super">R$</span>
          <span className="text-4xl font-bold text-foreground">
            {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Total de pedidos no período</p>
      </div>

      {allData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Sem dados de evolução de vendas
        </div>
      ) : (
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
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={55}
                domain={yDomain}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.05 }}
              />
              <Bar dataKey="value" shape={<CustomBar />} isAnimationActive={false} activeBar={{ fillOpacity: 0.9 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SalesChartCard;
