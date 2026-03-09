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

      <main className="flex-1 px-6 py-5 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        {loading || !data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            <KpiCards
              enviados={data.enviados}
              aprovados={data.aprovados}
              faturados={data.faturados}
              clientesPositivados={data.clientes_positivados}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 items-start">
              <OrdersTable orders={data.orders} />
              <ClientsTable clients={data.clients} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
