import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import KpiCards from '@/components/erp/KpiCards';
import OrdersTable from '@/components/erp/OrdersTable';
import ClientsTable from '@/components/erp/ClientsTable';
import Spinner from '@/components/ui/spinner';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface DashboardAPIResponse {
  dashboard: {
    sent: number;
    approved: number;
    invoiced: number;
    canceled: number;
  };
  orders: Array<{
    orc_codorc_web: number;
    orc_codorc_had: number;
    CLIENTE: string;
    orc_documento: string;
    LOCALIZACAO: string;
    orc_status: number | string;
    orc_val_tot: number;
    DATA_PEDIDO: string;
    [key: string]: unknown;
  }>;
  ultimos_clientes?: Array<{
    cli_codcli: number;
    cli_nomcli: string;
    cli_cidcli: string;
    cli_estcli: string;
    cli_dta_cad: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function mapStatus(status: unknown): 'enviado' | 'aprovado' | 'confirmado' | 'pendente' | 'cancelado' {
  const val = typeof status === 'number' ? status : Number(status);
  if (!isNaN(val)) {
    if (val === 10) return 'pendente';
    if (val === 20) return 'enviado';
    if (val === 30) return 'aprovado';
    if (val === 40 || val === 50) return 'confirmado';
    if (val === 90) return 'cancelado';
  }
  const s = String(status || '').toLowerCase();
  if (s === 'en' || s.includes('enviad')) return 'enviado';
  if (s.includes('aprov') || s === 'ap') return 'aprovado';
  if (s.includes('confirm') || s.includes('fatur') || s === 'fa' || s === 'pc') return 'confirmado';
  if (s.includes('cancel') || s === 'ca') return 'cancelado';
  return 'pendente';
}

const DEFAULT_START_DATE = new Date(2026, 0, 8);
const DEFAULT_END_DATE = new Date(2026, 2, 9);
const toApiDate = (date: Date) => format(date, 'yyyy-MM-dd');

const Index = () => {
  const { representantes } = useRepresentantes();
  const [selectedRep, setSelectedRep] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<{ startDate: Date; endDate: Date }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [filterNonce, setFilterNonce] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const repParam = selectedRep.length > 0 ? selectedRep.join(',') : undefined;
  const dateIniParam = toApiDate(selectedPeriod.startDate);
  const dateEndParam = toApiDate(selectedPeriod.endDate);

  const { data: ordersData, isLoading, isFetching, error } = useApiFetch<DashboardAPIResponse>({
    queryKey: ['dashboard-orders', repParam || 'all', dateIniParam, dateEndParam, String(filterNonce)],
    endpoint: 'fetch-orders',
    params: {
      page: '1',
      limit: '10',
      date_ini: dateIniParam,
      date_end: dateEndParam,
      ...(repParam ? { rep: repParam } : {}),
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: dashData } = useApiFetch<DashboardAPIResponse>({
    queryKey: ['dashboard-clients', repParam || 'all', dateIniParam, dateEndParam, String(filterNonce)],
    endpoint: 'fetch-dashboard',
    params: {
      date_ini: dateIniParam,
      date_end: dateEndParam,
      ...(repParam ? { rep: repParam } : {}),
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleRepChange = useCallback((_repCodes: number[]) => {}, []);
  const handleFilter = useCallback((filters: { startDate: Date; endDate: Date; repCodes: number[]; repCodesRaw: string[]; search: string }) => {
    setSelectedRep(filters.repCodes);
    setSelectedPeriod({ startDate: filters.startDate, endDate: filters.endDate });
    setFilterNonce((n) => n + 1);
  }, []);
  const handleClear = useCallback(() => {
    setSelectedRep([]);
    setSelectedPeriod({ startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE });
    setFilterNonce((n) => n + 1);
  }, []);

  const orders = useMemo(() => {
    const rawOrders = ordersData?.orders || ordersData?.data || [];
    return (rawOrders as any[]).map((p: any) => {
      let dataPedido = p.DATA_PEDIDO || p.orc_dta || p.data_pedido || '';
      if (dataPedido) {
        try {
          const d = new Date(dataPedido);
          if (!isNaN(d.getTime())) {
            dataPedido = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          }
        } catch {}
      }
      return {
        id: String(p.orc_codorc_web || p.orc_codorc || p.id),
        codigo: String(p.orc_codorc_web || p.orc_codorc || p.codigo),
        cliente_nome: p.CLIENTE || p.orc_nomcli || p.cliente_nome || '',
        cliente_cnpj: p.orc_documento || p.orc_cgccli || p.cliente_cnpj || '',
        localizacao: p.LOCALIZACAO || (p.orc_cidcli
          ? [p.orc_cidcli, p.orc_estcli].filter(Boolean).join(' - ')
          : (p.localizacao || '')),
        status: mapStatus(p.orc_status || p.status || ''),
        valor: p.orc_val_tot || p.orc_vlrtot || p.valor || 0,
        data_pedido: dataPedido,
        erp_code: p.orc_codorc_had ? `ERP:${p.orc_codorc_had}` : (p.orc_coderp ? `ERP:${p.orc_coderp}` : (p.erp_code || undefined)),
      };
    });
  }, [ordersData]);

  const clients = useMemo(() =>
    (dashData?.ultimos_clientes || []).map((c) => ({
      id: String(c.cli_codcli),
      nome: c.cli_nomcli || '',
      localizacao: [c.cli_cidcli, c.cli_estcli].filter(Boolean).join(' - '),
      data_cadastro: c.cli_dta_cad || '',
    })),
    [dashData?.ultimos_clientes]
  );

  return (
    <>
      {/* Hero banner - Metronic-style gradient */}
      <div className="relative bg-gradient-to-br from-[hsl(220,60%,22%)] via-[hsl(200,55%,32%)] to-[hsl(160,50%,42%)] overflow-hidden">
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.8'%3E%3Cline x1='0' y1='0' x2='300' y2='300'/%3E%3Cline x1='60' y1='0' x2='300' y2='240'/%3E%3Cline x1='120' y1='0' x2='300' y2='180'/%3E%3Cline x1='0' y1='60' x2='240' y2='300'/%3E%3Cline x1='0' y1='120' x2='180' y2='300'/%3E%3Ccircle cx='50' cy='40' r='2' fill='%23ffffff'/%3E%3Ccircle cx='200' cy='70' r='1.5' fill='%23ffffff'/%3E%3Ccircle cx='120' cy='180' r='2' fill='%23ffffff'/%3E%3Ccircle cx='250' cy='220' r='1.5' fill='%23ffffff'/%3E%3Ccircle cx='80' cy='260' r='1' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-[-50px] right-[15%] w-72 h-72 bg-[hsl(175,60%,50%)] rounded-full blur-[140px] opacity-20" />
        <div className="absolute bottom-[-30px] left-[25%] w-56 h-56 bg-[hsl(210,70%,50%)] rounded-full blur-[110px] opacity-15" />
        {/* Spacer for overlaid transparent header */}
        <div className="h-[70px]" />
        <div className="relative px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground">Dashboard</h1>
            <p className="text-sm text-primary-foreground/50 mt-1">Visão geral de pedidos e clientes</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <Filter size={14} className="mr-1.5" />
              Filtrar
            </Button>
          </div>
        </div>
        {/* Extra height so gradient extends behind KPI cards */}
        <div className="h-20 sm:h-24" />
      </div>

      {/* Collapsible filter bar */}
      {showFilters && (
        <FilterBar representantes={representantes} onRepChange={handleRepChange} onFilter={handleFilter} onClear={handleClear} />
      )}

      <main className="flex-1 px-4 sm:px-8 pb-6 space-y-6 -mt-20 sm:-mt-24 relative z-10">
        {(isLoading || isFetching) ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{(error as Error).message}</div>
        ) : (
          <>
            <KpiCards
              enviados={ordersData?.dashboard?.sent ?? 0}
              aprovados={ordersData?.dashboard?.approved ?? 0}
              faturados={ordersData?.dashboard?.invoiced ?? 0}
              cancelados={ordersData?.dashboard?.canceled ?? 0}
              clientesPositivados={0}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 items-start">
              <OrdersTable orders={orders} />
              <ClientsTable clients={clients} />
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default Index;
