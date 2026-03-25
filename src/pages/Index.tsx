import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import OrdersTable from '@/components/erp/OrdersTable';
import { useApiFetch } from '@/hooks/use-api-fetch';

import EarningsCard from '@/components/erp/dashboard/EarningsCard';
import SalesChartCard from '@/components/erp/dashboard/SalesChartCard';
import NewCustomersCard from '@/components/erp/dashboard/NewCustomersCard';
import ProductDeliveryCard from '@/components/erp/dashboard/ProductDeliveryCard';

import SkeletonEarnings from '@/components/erp/skeletons/SkeletonEarnings';
import SkeletonChart from '@/components/erp/skeletons/SkeletonChart';
import SkeletonCustomers from '@/components/erp/skeletons/SkeletonCustomers';
import SkeletonTable from '@/components/erp/skeletons/SkeletonTable';
import SkeletonProducts from '@/components/erp/skeletons/SkeletonProducts';
import FadeIn from '@/components/erp/skeletons/FadeIn';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

interface DashboardAPIResponse {
  cards: {
    total_pedidos: number;
    enviados: number;
    aprovados: number;
    faturados: number;
    cancelados: number;
    positivados: number;
  };
  ultimos_pedidos: Array<{
    codigo: number;
    cliente_nome: string;
    documento: string;
    localizacao: string;
    status: number;
    valor: number;
    data: string;
  }>;
  ultimos_clientes: Array<{
    codigo: number;
    nome: string;
    localizacao: string;
    data: string;
  }>;
  evolucao_vendas: Array<{
    dia: string;
    total: number;
  }>;
  top_produtos: Array<{
    codigo: number;
    descricao: string;
    quantidade: string;
    valor_total: string;
    foto?: string;
  }>;
}

function mapStatus(status: unknown): 'enviado' | 'aprovado' | 'confirmado' | 'pendente' | 'cancelado' {
  const val = typeof status === 'number' ? status : Number(status);
  if (!isNaN(val)) {
    if (val === 10 || val === 0) return 'pendente';
    if (val === 20) return 'enviado';
    if (val === 30) return 'aprovado';
    if (val === 40 || val === 50) return 'confirmado';
    if (val === 90) return 'cancelado';
  }
  return 'pendente';
}

const Index = () => {
  const { theme, setTheme } = useTheme();
  const { data: dashData, isLoading, error } = useApiFetch<DashboardAPIResponse>({
    queryKey: ['dashboard'],
    endpoint: 'fetch-dashboard',
    params: {},
    staleTime: 2 * 60 * 1000,
  });

  const cards = dashData?.cards;

  const orders = useMemo(() => {
    const raw = dashData?.ultimos_pedidos || [];
    return raw.map((p) => {
      let dataPedido = p.data || '';
      if (dataPedido) {
        try {
          const d = new Date(dataPedido);
          if (!isNaN(d.getTime())) {
            dataPedido = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          }
        } catch {}
      }
      return {
        id: String(p.codigo),
        codigo: String(p.codigo),
        cliente_nome: p.cliente_nome || '',
        cliente_cnpj: p.documento || '',
        localizacao: p.localizacao || '',
        status: mapStatus(p.status),
        valor: p.valor || 0,
        data_pedido: dataPedido,
      };
    });
  }, [dashData]);

  const evolucaoVendas = useMemo(() => {
    return (dashData?.evolucao_vendas || []).map((e) => ({
      date: e.dia,
      value: e.total,
    }));
  }, [dashData]);

  const topProdutos = useMemo(() => {
    return (dashData?.top_produtos || []).map((p) => ({
      codigo: p.codigo,
      descricao: p.descricao,
      quantidade: parseFloat(p.quantidade),
      valorTotal: parseFloat(p.valor_total),
      foto: p.foto || '',
    }));
  }, [dashData]);

  const ultimosClientes = useMemo(() => {
    return (dashData?.ultimos_clientes || []).map((c) => ({
      codigo: c.codigo,
      nome: c.nome,
      localizacao: c.localizacao,
      data: c.data,
    }));
  }, [dashData]);

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Clientes', path: '/clientes' },
    { label: 'Pedidos', path: '/pedidos' },
    { label: 'Relatórios', path: '/analitico' },
    { label: 'Analítico', path: '/analitico-periodo' },
    { label: 'Catálogo', path: '/catalogo' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))] transition-colors duration-200">
        <div className="absolute inset-x-0 top-0 h-[70px] bg-[hsl(var(--erp-banner))]" />
        <div className="h-[70px]" />
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Dashboard</h1>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={label}
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
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-4 p-2 rounded-full hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              title={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-4 sm:space-y-5 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        {error ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-destructive text-sm">{(error as Error).message}</p>
            <p className="text-muted-foreground text-xs mt-2">Tente recarregar a página</p>
          </div>
        ) : isLoading ? (
          <>
            {/* Skeleton layout matches real layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
              <div className="flex flex-col gap-4 sm:gap-5">
                <SkeletonEarnings />
                <SkeletonCustomers />
              </div>
              <div className="lg:col-span-2">
                <SkeletonChart />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 sm:gap-5 items-start">
              <SkeletonTable columns={6} rows={5} headers={['ID do Pedido', 'Criado', 'Cliente', 'Total', 'Lucro', 'Status']} />
              <SkeletonProducts />
            </div>
          </>
        ) : (
          <FadeIn>
            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
              <div className="flex flex-col gap-4 sm:gap-5">
                <EarningsCard
                  enviados={cards?.enviados ?? 0}
                  aprovados={cards?.aprovados ?? 0}
                  faturados={cards?.faturados ?? 0}
                  cancelados={cards?.cancelados ?? 0}
                />
                <NewCustomersCard
                  clientes={ultimosClientes}
                  positivados={cards?.positivados ?? 0}
                />
              </div>
              <div className="lg:col-span-2">
                <SalesChartCard
                  totalValue={cards?.total_pedidos ?? 0}
                  salesData={evolucaoVendas}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 sm:gap-5 items-start mt-4 sm:mt-5">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <OrdersTable orders={orders} />
              </div>
              <ProductDeliveryCard produtos={topProdutos} />
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
};

export default Index;
