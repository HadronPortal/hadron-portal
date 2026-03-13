import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, RadialBarChart, RadialBar } from 'recharts';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

// Mock data
const weeklyEarnings = [
  { day: 'Seg', value: 380 },
  { day: 'Ter', value: 520 },
  { day: 'Qua', value: 290 },
  { day: 'Qui', value: 610 },
  { day: 'Sex', value: 450 },
  { day: 'Sáb', value: 320 },
  { day: 'Dom', value: 480 },
];

const monthlyRevenue = [
  { month: 'Jan', value: 42500 },
  { month: 'Fev', value: 38200 },
  { month: 'Mar', value: 51800 },
  { month: 'Abr', value: 46300 },
  { month: 'Mai', value: 55100 },
  { month: 'Jun', value: 48700 },
];

const salesByRegion = [
  { region: 'Sudeste', value: 8567, percent: 45.2, trend: 'up' as const },
  { region: 'Sul', value: 2415, percent: 12.7, trend: 'up' as const },
  { region: 'Nordeste', value: 1865, percent: 9.8, trend: 'down' as const },
  { region: 'Centro-Oeste', value: 1245, percent: 6.6, trend: 'up' as const },
  { region: 'Norte', value: 745, percent: 3.9, trend: 'down' as const },
];

const campaignData = [
  { label: 'E-mail Marketing', value: 12346, percent: 0.3 },
  { label: 'Visita Presencial', value: 8734, percent: 2.1 },
  { label: 'Televendas', value: 967, percent: 1.4 },
  { label: 'Portal Online', value: 543, percent: 3.2 },
  { label: 'WhatsApp', value: 2150, percent: 5.7 },
];

const supportData = [{ value: 85, fill: 'hsl(var(--primary))' }];

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatK = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v}`;
};

const CustomBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const radius = Math.min(6, width / 2);
  return (
    <g>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={radius} ry={radius} fill="url(#barGrad)" />
    </g>
  );
};

const AnaliticoPeriodo = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Analítico</h1>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/60 mt-1">
              <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">Home</button>
              <span>›</span>
              <span className="text-primary-foreground/80">Analítico</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      {/* Content overlapping banner */}
      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full space-y-5">

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Vendas Diárias */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign size={20} className="text-primary" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <TrendingUp size={14} /> +18.2%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">R$ 28.450</p>
            <p className="text-xs text-muted-foreground mt-1">Vendas Diárias</p>
          </div>

          {/* Pedidos */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-[hsl(var(--erp-blue))/0.1] flex items-center justify-center">
                <ShoppingCart size={20} className="text-[hsl(var(--erp-blue))]" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <TrendingUp size={14} /> +12.6%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">1.245</p>
            <p className="text-xs text-muted-foreground mt-1">Total de Pedidos</p>
          </div>

          {/* Clientes Ativos */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users size={20} className="text-amber-500" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                <TrendingDown size={14} /> -2.4%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">842</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes Ativos</p>
          </div>

          {/* Produtos */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-[hsl(var(--erp-green))/0.1] flex items-center justify-center">
                <Package size={20} className="text-[hsl(var(--erp-green))]" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <TrendingUp size={14} /> +8.5%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">3.156</p>
            <p className="text-xs text-muted-foreground mt-1">Produtos Vendidos</p>
          </div>
        </div>

        {/* Row 2: Earning Reports + Support Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Earning Reports - 3 cols */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-base font-semibold text-foreground">Faturamento Semanal</h3>
                <p className="text-xs text-muted-foreground">Visão geral da semana</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">R$ 3.050</span>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">+4.2%</span>
            </div>

            <div className="h-[180px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyEarnings} barCategoryGap="30%">
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatCurrency(v), 'Valor']}
                  />
                  <Bar dataKey="value" shape={<CustomBar />} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Faturamento</span>
                </div>
                <p className="text-base font-bold text-foreground">R$ 1.545</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Lucro</span>
                </div>
                <p className="text-base font-bold text-foreground">R$ 856</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Despesas</span>
                </div>
                <p className="text-base font-bold text-foreground">R$ 274</p>
              </div>
            </div>
          </div>

          {/* Support Tracker / Performance - 2 cols */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
            <div className="mb-1">
              <h3 className="text-base font-semibold text-foreground">Performance</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">164</span>
              <span className="text-xs text-muted-foreground">Pedidos Processados</span>
            </div>

            {/* Radial chart */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <RadialBarChart
                  width={180}
                  height={180}
                  cx={90}
                  cy={90}
                  innerRadius={60}
                  outerRadius={80}
                  barSize={12}
                  data={supportData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: 'hsl(var(--muted))' }}
                  />
                </RadialBarChart>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-foreground">85%</span>
                  <span className="text-[10px] text-muted-foreground">Concluído</span>
                </div>
              </div>
            </div>

            {/* Stats list */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingCart size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Novos Pedidos</p>
                  <p className="text-xs text-muted-foreground">142</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Package size={16} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Pedidos Entregues</p>
                  <p className="text-xs text-muted-foreground">28</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart3 size={16} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Tempo Médio</p>
                  <p className="text-xs text-muted-foreground">1 Dia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Sales by Region + Revenue Chart + Campaign */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sales by Region */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Vendas por Região</h3>
            <p className="text-xs text-muted-foreground mb-4">Visão mensal</p>

            <div className="space-y-4">
              {salesByRegion.map((r) => (
                <div key={r.region} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                      {r.region.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatK(r.value)}</p>
                      <p className="text-xs text-muted-foreground">{r.region}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${r.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {r.trend === 'up' ? '↑' : '↓'} {r.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-base font-semibold text-foreground">Receita Total</h3>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-foreground">87%</span>
              <span className="text-xs font-medium text-emerald-500">↑ 25.8%</span>
            </div>

            <div className="h-[160px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatCurrency(v), 'Receita']}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Receita Clientes</p>
                <p className="text-sm font-bold text-foreground">+R$ 12.600</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Vendas</p>
                <p className="text-sm font-bold text-foreground">+R$ 9.800</p>
              </div>
            </div>
          </div>

          {/* Campaign State */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Canais de Venda</h3>
            <p className="text-xs text-muted-foreground mb-4">Visão mensal dos canais</p>

            <div className="space-y-3.5">
              {campaignData.map((c) => {
                const maxVal = Math.max(...campaignData.map(d => d.value));
                const barWidth = (c.value / maxVal) * 100;
                return (
                  <div key={c.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground">{c.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground tabular-nums">{c.value.toLocaleString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{c.percent}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AnaliticoPeriodo;
