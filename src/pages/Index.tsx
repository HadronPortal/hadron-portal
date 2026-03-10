import { useEffect, useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import KpiCards from '@/components/erp/KpiCards';
import OrdersTable from '@/components/erp/OrdersTable';
import ClientsTable from '@/components/erp/ClientsTable';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';

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

const Index = () => {
  const [data, setData] = useState<DashboardAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-dashboard`
        );
        if (!res.ok) throw new Error('Falha ao buscar dashboard');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const orders = (data?.ultimos_pedidos || []).map((p) => ({
    id: String(p.orc_codorc),
    codigo: String(p.orc_codorc),
    cliente_nome: p.orc_nomcli || '',
    cliente_cnpj: p.orc_cgccli || '',
    localizacao: [p.orc_cidcli, p.orc_estcli].filter(Boolean).join(' - '),
    status: mapStatus(p.orc_status),
    valor: p.orc_vlrtot || 0,
    data_pedido: p.orc_dta || '',
    erp_code: p.orc_coderp ? `ERP:${p.orc_coderp}` : undefined,
  }));

  const clients = (data?.ultimos_clientes || []).map((c) => ({
    id: String(c.cli_codcli),
    nome: c.cli_nomcli || '',
    localizacao: [c.cli_cidcli, c.cli_estcli].filter(Boolean).join(' - '),
    data_cadastro: c.cli_dta_cad || '',
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        {loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{error}</div>
        ) : data ? (
          <>
            <KpiCards
              enviados={data.cards.enviados}
              aprovados={data.cards.aprovados}
              faturados={data.cards.faturados}
              cancelados={data.cards.cancelados}
              clientesPositivados={data.cards.positivados}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 items-start">
              <OrdersTable orders={orders} />
              <ClientsTable clients={clients} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

function mapStatus(status: string): 'aprovado' | 'confirmado' | 'pendente' | 'cancelado' {
  const s = (status || '').toLowerCase();
  if (s.includes('aprov')) return 'aprovado';
  if (s.includes('confirm') || s.includes('fatur')) return 'confirmado';
  if (s.includes('cancel')) return 'cancelado';
  return 'pendente';
}

export default Index;
