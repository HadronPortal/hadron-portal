import { useState, useMemo, useCallback } from 'react';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import KpiCards from '@/components/erp/KpiCards';
import OrdersTable from '@/components/erp/OrdersTable';
import ClientsTable from '@/components/erp/ClientsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface DashboardAPIResponse {
  cards: {
    enviados: number;
    aprovados: number;
    faturados: number;
    cancelados: number;
    positivados: number;
  };
  ultimos_pedidos: Array<{
    orc_codorc: number;
    orc_nomcli: string;
    orc_cgccli: string;
    orc_cidcli: string;
    orc_estcli: string;
    orc_status: string;
    orc_vlrtot: number;
    orc_peso: number;
    orc_dta: string;
    orc_coderp?: string;
    [key: string]: unknown;
  }>;
  ultimos_clientes: Array<{
    cli_codcli: number;
    cli_nomcli: string;
    cli_cidcli: string;
    cli_estcli: string;
    cli_dta_cad: string;
    [key: string]: unknown;
  }>;
  representantes: Array<{
    rep_codrep: number;
    rep_nomrep: string;
  }>;
  evolucao_vendas: unknown[];
}

function mapStatus(status: string): 'aprovado' | 'confirmado' | 'pendente' | 'cancelado' {
  const s = (status || '').toLowerCase();
  if (s.includes('aprov')) return 'aprovado';
  if (s.includes('confirm') || s.includes('fatur')) return 'confirmado';
  if (s.includes('cancel')) return 'cancelado';
  return 'pendente';
}

const Index = () => {
  const { representantes } = useRepresentantes();
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : undefined;

  const { data, isLoading, isFetching, error } = useApiFetch<DashboardAPIResponse>({
    queryKey: ['dashboard', repParam || 'all'],
    endpoint: 'fetch-dashboard',
    params: repParam ? { rep: repParam } : {},
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: ordersData } = useApiFetch<any>({
    queryKey: ['orders-dashboard', repParam || 'all'],
    endpoint: 'fetch-orders',
    params: {
      page: '1',
      limit: '10',
      ...(repParam ? { rep: repParam } : {}),
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const handleRepChange = useCallback((repCodes: number[]) => setSelectedRep(repCodes), []);
  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const handleFilter = useCallback((filters: { startDate: Date; endDate: Date; repCodes: number[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSearchQuery(filters.search);
  }, []);
  const handleClear = useCallback(() => {
    setSelectedRep([]);
    setSearchQuery('');
  }, []);

  const orders = useMemo(() => {
    const rawOrders = ordersData?.ultimos_pedidos || ordersData?.data || ordersData?.orders || [];
    return rawOrders.map((p: any) => ({
      id: String(p.orc_codorc || p.id),
      codigo: String(p.orc_codorc || p.codigo),
      cliente_nome: p.orc_nomcli || p.cliente_nome || '',
      cliente_cnpj: p.orc_cgccli || p.cliente_cnpj || '',
      localizacao: p.orc_cidcli
        ? [p.orc_cidcli, p.orc_estcli].filter(Boolean).join(' - ')
        : (p.localizacao || ''),
      status: mapStatus(p.orc_status || p.status || ''),
      valor: p.orc_vlrtot || p.valor || 0,
      data_pedido: p.orc_dta || p.data_pedido || '',
      erp_code: p.orc_coderp ? `ERP:${p.orc_coderp}` : (p.erp_code || undefined),
    }));
  }, [ordersData]);

  const clients = useMemo(() =>
    (data?.ultimos_clientes || []).map((c) => ({
      id: String(c.cli_codcli),
      nome: c.cli_nomcli || '',
      localizacao: [c.cli_cidcli, c.cli_estcli].filter(Boolean).join(' - '),
      data_cadastro: c.cli_dta_cad || '',
    })),
    [data?.ultimos_clientes]
  );

  return (
    <>
      <FilterBar representantes={representantes} onRepChange={handleRepChange} onSearch={handleSearch} onFilter={handleFilter} onClear={handleClear} />

      <main className={`flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>

        {isLoading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{(error as Error).message}</div>
        ) : data ? (
          <>
            <KpiCards
              enviados={data.cards.enviados}
              aprovados={data.cards.aprovados}
              faturados={data.cards.faturados}
              cancelados={data.cards.cancelados}
              clientesPositivados={data.cards.positivados}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 sm:gap-5 items-start">
              <OrdersTable orders={orders} />
              <ClientsTable clients={clients} />
            </div>
          </>
        ) : null}
      </main>
    </>
  );
};

export default Index;
