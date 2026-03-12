import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

import FilterBar from '@/components/erp/FilterBar';
import { useRepresentantes } from '@/hooks/use-representantes';
import OrdersTable from '@/components/erp/OrdersTable';
import Spinner from '@/components/ui/spinner';
import { useApiFetch } from '@/hooks/use-api-fetch';

import EarningsCard from '@/components/erp/dashboard/EarningsCard';
import DailySalesCard from '@/components/erp/dashboard/DailySalesCard';
import SalesChartCard from '@/components/erp/dashboard/SalesChartCard';
import OrdersMonthCard from '@/components/erp/dashboard/OrdersMonthCard';
import NewCustomersCard from '@/components/erp/dashboard/NewCustomersCard';
import DiscountedSalesCard from '@/components/erp/dashboard/DiscountedSalesCard';
import ProductDeliveryCard from '@/components/erp/dashboard/ProductDeliveryCard';
import StockReportCard from '@/components/erp/dashboard/StockReportCard';

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
    const rawOrders = ordersData?.orders || (ordersData as any)?.data || [];
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

  // Compute KPI values from API
  const totalSent = ordersData?.dashboard?.sent ?? 0;
  const totalApproved = ordersData?.dashboard?.approved ?? 0;
  const totalInvoiced = ordersData?.dashboard?.invoiced ?? 0;
  const totalEarnings = totalSent + totalApproved + totalInvoiced;

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(220,60%,15%)]">
        <div className="absolute inset-x-0 top-0 h-[70px] bg-black" />
        <div className="h-[70px]" />
        <div className="relative px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <FilterBar representantes={representantes} onRepChange={handleRepChange} onFilter={handleFilter} onClear={handleClear} />
          </div>
        </div>
        <div className="h-20 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 pb-6 space-y-5 -mt-20 sm:-mt-24 relative z-10">
        {(isLoading || isFetching) ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{(error as Error).message}</div>
        ) : (
          <>
            {/* Row 1: Status (EarningsCard) + NewCustomers | Venda Mês (SalesChart) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="flex flex-col gap-5">
                <EarningsCard />
                <NewCustomersCard />
              </div>
              <div className="lg:col-span-2">
                <SalesChartCard totalValue={totalInvoiced} />
              </div>
            </div>

            {/* Row 2: Recent Orders | Discounted Sales */}
            <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5 items-start">
              <OrdersTable orders={orders} />
              <DiscountedSalesCard />
            </div>

            {/* Row 3: Product Delivery | Stock Report */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5 items-start">
              <ProductDeliveryCard />
              <StockReportCard />
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default Index;
