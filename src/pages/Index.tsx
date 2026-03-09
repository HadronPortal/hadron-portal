import { useEffect, useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import KpiCards from '@/components/erp/KpiCards';
import OrdersTable from '@/components/erp/OrdersTable';
import ClientsTable from '@/components/erp/ClientsTable';
import { fetchDashboard, type DashboardData } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-4 md:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
        {loading || !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        ) : (
          <>
            <KpiCards
              enviados={data.enviados}
              aprovados={data.aprovados}
              faturados={data.faturados}
              clientesPositivados={data.clientes_positivados}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <OrdersTable orders={data.orders} />
              </div>
              <div>
                <ClientsTable clients={data.clients} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
