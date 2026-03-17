import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CatalogoDetalhe from '@/components/erp/CatalogoDetalhe';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Search, X } from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight, CalendarDays, CreditCard, Truck, User, Mail, Phone, FileText, Package, Award } from 'lucide-react';
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

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  'EN': { label: 'Enviado', color: '#0d9488', bg: '#0d948818' },
  'AP': { label: 'Aprovado', color: '#f59e0b', bg: '#f59e0b18' },
  'FA': { label: 'Faturado', color: '#06b6d4', bg: '#06b6d418' },
  'CA': { label: 'Cancelado', color: '#ef4444', bg: '#ef444418' },
  'PC': { label: 'Pagamento Confirmado', color: '#22c55e', bg: '#22c55e18' },
  'PE': { label: 'Pendente', color: '#eab308', bg: '#eab30818' },
  '10': { label: 'Digitação', color: '#8b8b8b', bg: '#8b8b8b18' },
  '20': { label: 'Enviado', color: '#0d9488', bg: '#0d948818' },
  '30': { label: 'Aprovado', color: '#f59e0b', bg: '#f59e0b18' },
  '40': { label: 'Faturado', color: '#06b6d4', bg: '#06b6d418' },
  '50': { label: 'Faturado', color: '#06b6d4', bg: '#06b6d418' },
  '90': { label: 'Cancelado', color: '#ef4444', bg: '#ef444418' },
};

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?url=`;

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Relatórios', path: '/analitico' },
  { label: 'Analítico', path: '/analitico-periodo' },
  { label: 'Catálogo', path: '/catalogo' },
];

const PedidoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<Record<string, { qty: number; price: number }>>({});
  const [editObs, setEditObs] = useState('');
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set());
  const [addedItems, setAddedItems] = useState<Array<{ id: string; codpro: number; despro: string; undpro: string; peso_liq: number; qty: number; price: number }>>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductSearch, setAddProductSearch] = useState('');
  const [catalogoResults, setCatalogoResults] = useState<any[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  useEffect(() => {
    if (location.state?.edit) {
      setIsEditing(true);
      // Clean the state so refreshing doesn't re-enter edit mode
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const { data, isLoading: loading, error: queryError } = useApiFetch<{ order: any; items: any[] }>({
    queryKey: ['order-details', String(id)],
    endpoint: 'fetch-order-details',
    params: { order_id: id },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const error = queryError ? (queryError as Error).message : null;
  const order = data?.order || null;
  const items = data?.items || [];

  // Initialize edit state when data loads
  useEffect(() => {
    if (items.length > 0 && Object.keys(editItems).length === 0) {
      const initial: Record<string, { qty: number; price: number }> = {};
      items.forEach((item: any) => {
        initial[item.oit_id] = { qty: item.oit_qtdoit || 0, price: item.oit_prcpro || 0 };
      });
      setEditItems(initial);
      setEditObs(order?.orc_obs || '');
    }
  }, [items]);

  const startEditing = () => {
    const initial: Record<string, { qty: number; price: number }> = {};
    items.forEach((item: any) => {
      initial[item.oit_id] = { qty: item.oit_qtdoit || 0, price: item.oit_prcpro || 0 };
    });
    setEditItems(initial);
    setEditObs(order?.orc_obs || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    // For now, show a toast since saving requires API integration
    toast.info('Funcionalidade de salvamento será integrada com a API em breve.');
    setIsEditing(false);
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setEditItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], qty } }));
  };

  const updateItemPrice = (itemId: string, price: number) => {
    setEditItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], price } }));
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Spinner />
    </div>
  );

  if (error || !order) return (
    <div className="flex-1 flex items-center justify-center text-destructive py-24">
      {error || 'Pedido não encontrado'}
    </div>
  );

  const st = statusMap[order.orc_status] || { label: order.orc_status || '—', color: '#8b8b8b', bg: '#8b8b8b18' };

  const getItemQty = (item: any) => isEditing ? (editItems[item.oit_id]?.qty ?? item.oit_qtdoit) : item.oit_qtdoit;
  const getItemPrice = (item: any) => isEditing ? (editItems[item.oit_id]?.price ?? item.oit_prcpro) : item.oit_prcpro;
  const getItemTotal = (item: any) => getItemQty(item) * getItemPrice(item);

  const totalItens = items.reduce((s: number, i: any) => s + getItemTotal(i), 0);
  const totalPeso = items.reduce((s: number, i: any) => s + (getItemQty(i) * (i.oit_peso_liq || 0)), 0);

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="absolute inset-x-0 top-0 h-[70px] bg-[hsl(var(--erp-banner))]" />
        <div className="h-[70px]" />
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Detalhe do Pedido</h1>
            <div className="flex items-center gap-2 text-xs text-primary-foreground/60 mt-1">
              <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">Home</button>
              <ChevronRight size={12} />
              <button onClick={() => navigate('/pedidos')} className="hover:text-primary-foreground transition-colors">Pedidos</button>
              <ChevronRight size={12} />
              <span className="text-primary-foreground/90">#{order.orc_codorc_web}</span>
            </div>
          </div>
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
          </nav>
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-5 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">

        {/* Top action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
              style={{ backgroundColor: st.bg, color: st.color, borderColor: st.color + '40' }}
            >
              {st.label}
            </span>
            {order.orc_codorc_had > 0 && (
              <span className="text-xs text-muted-foreground">ERP: {order.orc_codorc_had}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" className="rounded-lg text-sm" onClick={cancelEditing}>
                  Cancelar
                </Button>
                <Button className="rounded-lg text-sm gap-1.5" onClick={handleSave}>
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="rounded-lg text-sm gap-1.5" onClick={startEditing}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button variant="outline" className="rounded-lg text-sm" onClick={() => navigate('/pedidos')}>
                  Voltar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 3 info cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Order Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-5">Detalhes do Pedido (#{order.orc_codorc_web})</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CalendarDays size={16} className="text-muted-foreground/60" />
                  Data do Pedido
                </div>
                <span className="text-sm font-medium text-foreground">{formatDate(order.orc_dta_orc)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CalendarDays size={16} className="text-muted-foreground/60" />
                  Validade
                </div>
                <span className="text-sm font-medium text-foreground">{formatDate(order.orc_dtavld)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CreditCard size={16} className="text-muted-foreground/60" />
                  Forma Pgto
                </div>
                <span className="text-sm font-medium text-foreground">{order.orc_codcpg || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Truck size={16} className="text-muted-foreground/60" />
                  Frete
                </div>
                <span className="text-sm font-medium text-foreground">{order.orc_tp_fre || 'CIF'}</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-5">Dados do Cliente</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <User size={16} className="text-muted-foreground/60" />
                  Cliente
                </div>
                <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">
                  {order.orc_nomter || order.orc_fanter || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <FileText size={16} className="text-muted-foreground/60" />
                  Documento
                </div>
                <span className="text-sm font-medium text-foreground">{formatDoc(order.orc_documento)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone size={16} className="text-muted-foreground/60" />
                  Código
                </div>
                <span className="text-sm font-medium text-foreground">#{order.orc_codter}</span>
              </div>
              {order.REPRESENTANTE && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <User size={16} className="text-muted-foreground/60" />
                    Representante
                  </div>
                  <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">
                    {order.REPRESENTANTE}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-5">Totais</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Package size={16} className="text-muted-foreground/60" />
                  Itens
                </div>
                <span className="text-sm font-medium text-foreground">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Truck size={16} className="text-muted-foreground/60" />
                  Peso Total
                </div>
                <span className="text-sm font-medium text-foreground">{totalPeso.toFixed(1)} Kg</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Award size={16} className="text-muted-foreground/60" />
                  Valor Total
                </div>
                <span className="text-base font-bold text-foreground">{formatCurrency(order.orc_vlrorc || totalItens)}</span>
              </div>
              {order.orc_obs && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Obs: {order.orc_obs}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Endereço de Cobrança</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{order.orc_end_lgr}{order.orc_numlgr ? `, ${order.orc_numlgr}` : ''}</p>
              {order.orc_cpllgr && <p>{order.orc_cpllgr}</p>}
              <p>{order.orc_bailgr && `${order.orc_bailgr} - `}{order.orc_cidlgr}/{order.orc_uflgr}</p>
              {order.orc_ceplgr && <p>CEP {order.orc_ceplgr}</p>}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Endereço de Entrega</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {order.orc_end_etg ? (
                <>
                  <p>{order.orc_end_etg}{order.orc_num_etg ? `, ${order.orc_num_etg}` : ''}</p>
                  {order.orc_cpl_etg && <p>{order.orc_cpl_etg}</p>}
                  <p>{order.orc_bai_etg && `${order.orc_bai_etg} - `}{order.orc_cid_etg}/{order.orc_uf_etg}</p>
                  {order.orc_cep_etg && <p>CEP {order.orc_cep_etg}</p>}
                </>
              ) : (
                <p>Mesmo endereço de cobrança</p>
              )}
            </div>
          </div>
        </div>

        {/* Observação (edit mode) */}
        {isEditing && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Observação</h3>
            <Textarea
              value={editObs}
              onChange={(e) => setEditObs(e.target.value)}
              placeholder="Observações do pedido..."
              className="min-h-[80px] text-sm"
            />
          </div>
        )}

        {/* Items table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Pedido #{order.orc_codorc_web}</h2>
            {isEditing && <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-md">Modo edição</span>}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Produto</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SKU</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Qtde</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Preço Un.</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow
                    key={item.oit_id}
                    className={`hover:bg-accent/30 border-b border-border/50 ${!isEditing ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedProductId(item.oit_codpro);
                        setSelectedProductName(item.oit_despro);
                        setDetailOpen(true);
                      }
                    }}
                  >
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-foreground">{item.oit_despro}</span>
                          <div className="text-xs text-muted-foreground">{item.oit_undpro} | Peso: {item.oit_peso_liq} Kg</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{item.oit_codpro}</TableCell>
                    <TableCell className="text-sm text-center text-foreground" onClick={e => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={getItemQty(item)}
                          onChange={(e) => updateItemQty(item.oit_id, Number(e.target.value))}
                          className="h-8 w-20 text-center text-sm mx-auto"
                        />
                      ) : (
                        item.oit_qtdoit
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right text-foreground" onClick={e => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={getItemPrice(item)}
                          onChange={(e) => updateItemPrice(item.oit_id, Number(e.target.value))}
                          className="h-8 w-24 text-right text-sm ml-auto"
                        />
                      ) : (
                        formatCurrency(item.oit_prcpro)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right font-semibold text-foreground">{formatCurrency(getItemTotal(item))}</TableCell>
                  </TableRow>
                ))}

                {/* Totals rows */}
                <TableRow className="border-t border-border">
                  <TableCell colSpan={4} className="text-sm text-muted-foreground text-right">Subtotal</TableCell>
                  <TableCell className="text-sm font-medium text-foreground text-right">{formatCurrency(totalItens)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground text-right">Peso Total</TableCell>
                  <TableCell className="text-sm font-medium text-foreground text-right">{totalPeso.toFixed(1)} Kg</TableCell>
                </TableRow>
                <TableRow className="border-t-2 border-border">
                  <TableCell colSpan={4} className="text-sm font-bold text-foreground text-right">Total</TableCell>
                  <TableCell className="text-sm font-bold text-foreground text-right">{formatCurrency(isEditing ? totalItens : (order.orc_vlrorc || totalItens))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dates card */}
        {(order.orc_dta_nf || order.orc_dta_etg) && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Histórico</h3>
            <div className="space-y-3">
              {order.orc_dta_nf && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nota Fiscal</span>
                  <span className="text-foreground">{formatDate(order.orc_dta_nf)}</span>
                </div>
              )}
              {order.orc_dta_etg && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="text-foreground">{formatDate(order.orc_dta_etg)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <CatalogoDetalhe
        open={detailOpen}
        onOpenChange={setDetailOpen}
        productId={selectedProductId}
        productName={selectedProductName}
      />
    </>
  );
};

export default PedidoDetalhe;
