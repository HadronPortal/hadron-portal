import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/erp/Header';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Spinner from '@/components/ui/spinner';

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDoc = (doc: string) => {
  const d = (doc || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const statusMap: Record<string, { label: string; color: string }> = {
  'EN': { label: 'Enviado', color: 'bg-teal-600' },
  'AP': { label: 'Aprovado', color: 'bg-orange-500' },
  'FA': { label: 'Faturado', color: 'bg-cyan-500' },
  'CA': { label: 'Cancelado', color: 'bg-red-500' },
  'PC': { label: 'Pagamento Confirmado', color: 'bg-green-500' },
  'PE': { label: 'Pendente', color: 'bg-yellow-500' },
};

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?url=`;

const PedidoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-order-details?order_id=${id}`
        );
        if (!res.ok) throw new Error('Falha ao buscar detalhes');
        const data = await res.json();
        setOrder(data.order || null);
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Spinner />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center text-destructive">
        {error || 'Pedido não encontrado'}
      </div>
    </div>
  );

  const st = statusMap[order.orc_status] || { label: order.orc_status || '—', color: 'bg-muted' };
  const totalItens = items.reduce((s: number, i: any) => s + (i.oit_val_tot || 0), 0);
  const totalPeso = items.reduce((s: number, i: any) => s + ((i.oit_qtdoit || 0) * (i.oit_peso_liq || 0)), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pedidos')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Pedido #{order.orc_codorc_web}
          </h1>
          <span className={`${st.color} text-white text-xs px-2 py-1 rounded`}>{st.label}</span>
          {order.orc_codorc_had > 0 && (
            <span className="text-sm text-muted-foreground">ERP: {order.orc_codorc_had}</span>
          )}
        </div>

        {/* Order info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Cliente</h3>
            <p className="text-sm font-semibold text-foreground">{order.orc_codter} - {order.orc_nomter || order.orc_fanter}</p>
            <p className="text-xs text-muted-foreground">{formatDoc(order.orc_documento)}</p>
            <p className="text-xs text-muted-foreground">
              {order.orc_end_lgr}, {order.orc_numlgr} {order.orc_cpllgr}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.orc_bailgr} - {order.orc_cidlgr}/{order.orc_uflgr} - CEP {order.orc_ceplgr}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Datas</h3>
            <div className="text-xs space-y-1">
              <p><span className="text-muted-foreground">Pedido:</span> <span className="text-foreground">{formatDate(order.orc_dta_orc)}</span></p>
              <p><span className="text-muted-foreground">Validade:</span> <span className="text-foreground">{formatDate(order.orc_dtavld)}</span></p>
              {order.orc_dta_nf && <p><span className="text-muted-foreground">NF:</span> <span className="text-foreground">{formatDate(order.orc_dta_nf)}</span></p>}
              {order.orc_dta_etg && <p><span className="text-muted-foreground">Entrega:</span> <span className="text-foreground">{formatDate(order.orc_dta_etg)}</span></p>}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Totais</h3>
            <p className="text-lg font-bold text-foreground">{formatCurrency(order.orc_vlrorc || totalItens)}</p>
            <p className="text-xs text-muted-foreground">Peso: {totalPeso.toFixed(1)} Kg</p>
            <p className="text-xs text-muted-foreground">{items.length} ite{items.length === 1 ? 'm' : 'ns'}</p>
            {order.orc_obs && <p className="text-xs text-muted-foreground mt-2">Obs: {order.orc_obs}</p>}
          </div>
        </div>

        {/* Items table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Itens do Pedido</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">PRODUTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">TIPO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">QTDE</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">PREÇO UN.</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">DESC %</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">IPI</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.oit_id} className="hover:bg-accent/30">
                    <TableCell className="text-sm">
                      <span className="font-semibold">{item.oit_codpro} - {item.oit_despro}</span>
                      <div className="text-xs text-muted-foreground">{item.oit_undpro} | Peso: {item.oit_peso_liq} Kg</div>
                    </TableCell>
                    <TableCell className="text-sm">{item.oit_tp_oprc}</TableCell>
                    <TableCell className="text-sm text-right">{item.oit_qtdoit}</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(item.oit_prcpro)}</TableCell>
                    <TableCell className="text-sm text-right">{item.oit_desc}%</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(item.oit_val_ipi)}</TableCell>
                    <TableCell className="text-sm text-right font-semibold">{formatCurrency(item.oit_val_tot)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-border">
                  <TableCell colSpan={6} className="text-sm font-bold text-foreground text-right">TOTAL</TableCell>
                  <TableCell className="text-sm font-bold text-foreground text-right">{formatCurrency(totalItens)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PedidoDetalhe;
