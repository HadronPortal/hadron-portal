import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, User, MapPin, FileText, Calendar, Hash, Phone, Mail, Building2, ChevronLeft, ChevronRight, Pencil, X, ChevronDown, Trash2, GripVertical, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { fetchWithAuth } from '@/lib/auth-refresh';
import { useRepresentantes } from '@/hooks/use-representantes';

interface ClienteAPI {
  ter_codter: number;
  ter_nomter: string;
  ter_fanter: string;
  ter_documento: string;
  TEN_CIDLGR: string;
  TEN_UF_LGR: string;
  TOTAL_VENDAS: number | null;
  QUANT_VENDAS: number | null;
  ULT_VENDA: string | null;
  ULT_CODORC: number | null;
  ter_dta_cad: string;
  COD_REP: number;
}

interface OrderAPI {
  orc_codorc_web: number;
  orc_codorc_had: number;
  orc_datcad: string;
  orc_val_tot: number;
  orc_status: number | string;
  CLIENTE: string;
  CODTER: number;
  DATA_PEDIDO: string;
  [key: string]: unknown;
}

const formatDoc = (doc: string) => {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const formatCurrency = (v: number | null) => {
  if (v == null || v === 0) return 'R$ 0,00';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

const statusMap: Record<string, { label: string; color: string }> = {
  '10': { label: 'Digitação', color: 'bg-[hsl(var(--erp-amber)/0.12)] text-[hsl(var(--erp-amber))]' },
  '20': { label: 'Enviado', color: 'bg-primary/10 text-primary' },
  '30': { label: 'Aprovado', color: 'bg-[hsl(var(--erp-orange)/0.12)] text-[hsl(var(--erp-orange))]' },
  '40': { label: 'Faturado', color: 'bg-[hsl(var(--erp-green)/0.12)] text-[hsl(var(--erp-green))]' },
  '50': { label: 'Faturado', color: 'bg-[hsl(var(--erp-green)/0.12)] text-[hsl(var(--erp-green))]' },
  '90': { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
  FA: { label: 'Faturado', color: 'bg-[hsl(var(--erp-green)/0.12)] text-[hsl(var(--erp-green))]' },
  EN: { label: 'Enviado', color: 'bg-primary/10 text-primary' },
  AP: { label: 'Aprovado', color: 'bg-[hsl(var(--erp-orange)/0.12)] text-[hsl(var(--erp-orange))]' },
  CA: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
  PE: { label: 'Pendente', color: 'bg-[hsl(var(--erp-amber)/0.12)] text-[hsl(var(--erp-amber))]' },
};

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Analítico', path: '/analitico' },
  { label: 'Pedidos', path: '/pedidos' },
  { label: 'Catálogo', path: '/catalogo' },
];

const tabs = ['Visão Geral', 'Configurações Gerais', 'Configurações Avançadas'] as const;

const ClienteDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { representantes } = useRepresentantes();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const routeClient = (location.state as { client?: ClienteAPI } | null)?.client;
  const hasRouteClient = Boolean(routeClient && id && String(routeClient.ter_codter) === id);
  const [client, setClient] = useState<ClienteAPI | null>(hasRouteClient ? routeClient! : null);
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(!hasRouteClient);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Visão Geral');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const ordersLimit = 10;

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editDocumento, setEditDocumento] = useState('');
  const [editCidade, setEditCidade] = useState('');
  const [editUf, setEditUf] = useState('');
  const [editRep, setEditRep] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [expandedAddress, setExpandedAddress] = useState<number | null>(null);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editAddressIdx, setEditAddressIdx] = useState<number | null>(null);
  const [editLogradouro, setEditLogradouro] = useState('');
  const [editComplemento, setEditComplemento] = useState('');
  const [editBairro, setEditBairro] = useState('');

  // New address modal state
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddrNome, setNewAddrNome] = useState('');
  const [newAddrLinha1, setNewAddrLinha1] = useState('');
  const [newAddrLinha2, setNewAddrLinha2] = useState('');
  const [newAddrCidade, setNewAddrCidade] = useState('');
  const [newAddrEstado, setNewAddrEstado] = useState('');
  const [newAddrCep, setNewAddrCep] = useState('');
  const [newAddrPais, setNewAddrPais] = useState('');
  const [newAddrCobranca, setNewAddrCobranca] = useState(true);
  const [extraAddresses, setExtraAddresses] = useState<Array<{ label: string; logradouro: string; cidade: string; uf: string; nome: string; isDefault: boolean }>>([]);

  // Advanced settings state
  const [advPhone, setAdvPhone] = useState('');
  const [advPassword, setAdvPassword] = useState('******');
  const [advSmsNumber, setAdvSmsNumber] = useState('');
  const [editingAdvPhone, setEditingAdvPhone] = useState(false);
  const [editingAdvPassword, setEditingAdvPassword] = useState(false);
  const [editingAdvSms, setEditingAdvSms] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, brand: 'MasterCard', isPrimary: true, expired: false, lastFour: '6367', expiry: '12/2024', name: '', number: '', type: 'cartão de crédito Mastercard', issuer: 'VICBANK', euIa: 'id_4325df90sdf8', billingAddress: 'AU', phone: 'Nenhum telefone fornecido', email: 'smith@kpmg.com', origin: 'Austrália 🌏', cvc: 'Aprovado ✅' },
    { id: 2, brand: 'Visa', isPrimary: false, expired: false, lastFour: '4521', expiry: '02/2022', name: '', number: '', type: '', issuer: '', euIa: '', billingAddress: '', phone: '', email: '', origin: '', cvc: '' },
    { id: 3, brand: 'American Express', isPrimary: false, expired: true, lastFour: '8901', expiry: '08/2021', name: '', number: '', type: '', issuer: '', euIa: '', billingAddress: '', phone: '', email: '', origin: '', cvc: '' },
  ]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const maskDoc = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 11) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    const c = d.slice(0, 14);
    if (c.length <= 2) return c;
    if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
    if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
    if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
  };

  // Sync edit fields when client loads
  useEffect(() => {
    if (client) {
      setEditName(client.ter_nomter || '');
      setEditDocumento(maskDoc(client.ter_documento || ''));
      setEditCidade(client.TEN_CIDLGR || '');
      setEditUf(client.TEN_UF_LGR || '');
      setEditRep(String(client.COD_REP || ''));
    }
  }, [client]);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // Fetch client
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (routeClient && String(routeClient.ter_codter) === id) {
      setClient(routeClient);
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '100', search: id });
        const url = `https://${projectId}.supabase.co/functions/v1/fetch-clients?${params}`;
        const res = await fetchWithAuth(url, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Falha');
        const data = await res.json();
        const clients = data.clients || [];
        const found = clients.find((c: ClienteAPI) => String(c.ter_codter) === id);
        setClient(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, projectId, routeClient]);

  // Fetch orders for this client
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(ordersPage),
          limit: String(ordersLimit),
          codter: id || '',
          date_ini: '2000-01-01',
          date_end: '2100-12-31',
        });
        const url = `https://${projectId}.supabase.co/functions/v1/fetch-orders?${params}`;
        const res = await fetchWithAuth(url, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Falha');
        const data = await res.json();
        const fetchedOrders: OrderAPI[] = Array.isArray(data.orders) ? data.orders : [];
        const clientOrders = fetchedOrders.filter((o) => String(o.CODTER) === String(id));
        const backendTotal = Number(data.total_records || 0);

        setOrders(clientOrders);
        setOrdersTotal(backendTotal > 0 && clientOrders.length > 0 ? backendTotal : clientOrders.length);
      } catch (err) {
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    };
    if (id) fetchOrders();
  }, [id, ordersPage, projectId]);
  useEffect(() => {
    if (client || !id || orders.length === 0) return;

    setClient({
      ter_codter: Number(id),
      ter_nomter: orders[0].CLIENTE || `Cliente ${id}`,
      ter_fanter: '',
      ter_documento: '',
      TEN_CIDLGR: '',
      TEN_UF_LGR: '',
      TOTAL_VENDAS: orders.reduce((acc, o) => acc + (o.orc_val_tot || 0), 0),
      QUANT_VENDAS: ordersTotal || orders.length,
      ULT_VENDA: orders[0].DATA_PEDIDO || orders[0].orc_datcad || null,
      ULT_CODORC: orders[0].orc_codorc_web || null,
      ter_dta_cad: '',
      COD_REP: 0,
    });
  }, [client, id, orders, ordersTotal]);

  const ordersTotalPages = Math.ceil(ordersTotal / ordersLimit);
  const isPositivado = client ? ((client.TOTAL_VENDAS ?? 0) > 0 || (client.QUANT_VENDAS ?? 0) > 0) : ordersTotal > 0 || orders.length > 0;
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>Voltar</Button>
      </div>
    );
  }

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-black">
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Detalhes do Cliente</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-primary-foreground/60">
                <button onClick={() => navigate('/')} className="hover:text-primary-foreground/80 transition-colors">Home</button>
                <span>›</span>
                <button onClick={() => navigate('/clientes')} className="hover:text-primary-foreground/80 transition-colors">Clientes</button>
                <span>›</span>
                <span className="text-primary-foreground/80">Detalhes</span>
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
        </div>
        <div className="h-16 sm:h-24" />
      </div>

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-8 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Profile Card */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              {/* Avatar area */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User size={40} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground text-center">{client.ter_nomter}</h2>
                {client.ter_fanter && (
                  <p className="text-sm text-muted-foreground mt-0.5 text-center">{client.ter_fanter}</p>
                )}
              </div>

              {/* Details section */}
              <div className="border-t border-border px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-medium border-0 px-2.5 py-0.5 ${
                      isPositivado
                        ? 'bg-[hsl(var(--erp-green)/0.12)] text-[hsl(var(--erp-green))]'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {isPositivado ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Código</p>
                      <p className="text-sm font-medium text-foreground">{client.ter_codter}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Documento</p>
                      <p className="text-sm font-medium text-foreground">{formatDoc(client.ter_documento)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Localização</p>
                      <p className="text-sm font-medium text-foreground">{client.TEN_CIDLGR} - {client.TEN_UF_LGR}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Representante</p>
                      <p className="text-sm font-medium text-foreground">
                        {representantes.find(r => r.rep_codrep === client.COD_REP)?.rep_nomrep || `Cód. ${client.COD_REP}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cadastro</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(client.ter_dta_cad)}</p>
                    </div>
                  </div>

                  {client.ULT_CODORC && (
                    <div className="flex items-start gap-3">
                      <FileText size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Último Pedido</p>
                        <button
                          onClick={() => navigate(`/pedidos/${client.ULT_CODORC}`)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          #{client.ULT_CODORC}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium border-b-2 text-white ${
                      activeTab === tab
                        ? 'border-white'
                        : 'border-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'Visão Geral' && (
              <div className="space-y-6">
                {/* Summary cards - use orders data for accurate totals */}
                {(() => {
                  const totalVendas = orders.length > 0
                    ? orders.reduce((acc, o) => acc + (o.orc_val_tot || 0), 0)
                    : (client.TOTAL_VENDAS ?? 0);
                  const qtdPedidos = ordersTotal > 0 ? ordersTotal : (client.QUANT_VENDAS ?? 0);
                  const ultVenda = orders.length > 0 ? (orders[0].DATA_PEDIDO || orders[0].orc_datcad) : client.ULT_VENDA;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Total em Vendas</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(totalVendas)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Qtd. Pedidos</p>
                        <p className="text-xl font-bold text-foreground">{qtdPedidos}</p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Última Venda</p>
                        <p className="text-xl font-bold text-foreground">{formatDate(ultVenda)}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Transaction History */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                  <div className="px-6 py-5 border-b border-border">
                    <h3 className="text-base font-semibold text-foreground">Histórico de Pedidos</h3>
                  </div>

                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Spinner />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-sm text-muted-foreground">
                      Nenhum pedido encontrado
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nº Pedido</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => {
                              const st = statusMap[String(o.orc_status)] || { label: String(o.orc_status), color: 'bg-muted text-muted-foreground' };
                              return (
                                <tr key={o.orc_codorc_web} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                                  <td className="px-6 py-3.5">
                                    <button
                                      onClick={() => navigate(`/pedidos/${o.orc_codorc_web}`)}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      #{o.orc_codorc_web}
                                    </button>
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <Badge variant="outline" className={`text-[11px] font-medium border-0 px-2.5 py-0.5 ${st.color}`}>
                                      {st.label}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-foreground">{formatCurrency(o.orc_val_tot)}</td>
                                  <td className="px-6 py-3.5 text-sm text-muted-foreground">{formatDate(o.DATA_PEDIDO || o.orc_datcad)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {ordersTotalPages > 1 && (
                        <div className="flex items-center justify-end px-6 py-4 border-t border-border gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={ordersPage === 1}
                            onClick={() => setOrdersPage(p => p - 1)}
                          >
                            <ChevronLeft size={16} />
                          </Button>
                          {Array.from({ length: Math.min(ordersTotalPages, 5) }, (_, i) => i + 1).map(p => (
                            <Button
                              key={p}
                              variant={ordersPage === p ? 'default' : 'ghost'}
                              size="icon"
                              className="h-8 w-8 text-xs"
                              onClick={() => setOrdersPage(p)}
                            >
                              {p}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={ordersPage === ordersTotalPages}
                            onClick={() => setOrdersPage(p => p + 1)}
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Configurações Gerais' && (
              <div className="space-y-6">
                {/* Profile edit card */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                  <div className="px-6 py-5 border-b border-border">
                    <h3 className="text-base font-semibold text-foreground">Cadastro do Cliente</h3>
                  </div>
                   <div className="px-6 py-6 space-y-5">
                    {/* Avatar (view only) */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-2 block">Foto</label>
                      <div className="relative inline-block">
                        <div className="w-28 h-28 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center opacity-70">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User size={36} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nome */}
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">
                        Nome <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={editName}
                        readOnly
                        className="bg-transparent cursor-not-allowed opacity-70"
                      />
                    </div>

                    {/* E-mail e Telefone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">E-mail</label>
                        <Input
                          value={editEmail}
                          readOnly
                          className="bg-transparent cursor-not-allowed opacity-70"
                          type="email"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Telefone</label>
                        <Input
                          value={editTelefone}
                          readOnly
                          className="bg-transparent cursor-not-allowed opacity-70"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Documento */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Documento (CNPJ/CPF)</label>
                        <Input
                          value={editDocumento}
                          readOnly
                          className="bg-transparent cursor-not-allowed opacity-70"
                          placeholder="000.000.000-00"
                        />
                      </div>

                      {/* Representante */}
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Cód. Representante</label>
                        <Select value={editRep} disabled>
                          <SelectTrigger className="bg-transparent cursor-not-allowed opacity-70">
                            <SelectValue placeholder="Selecione o representante" />
                          </SelectTrigger>
                          <SelectContent>
                            {representantes.map((rep) => (
                              <SelectItem key={rep.rep_codrep} value={String(rep.rep_codrep)}>
                                {rep.rep_codrep} - {rep.rep_nomrep}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Address Book card */}
                {(() => {
                  const addresses = [
                    {
                      label: 'Principal',
                      isDefault: true,
                      logradouro: editCidade ? `${editCidade}` : 'Não informado',
                      cidade: editCidade,
                      uf: editUf,
                      nome: editName,
                    },
                    ...extraAddresses,
                  ];

                  return (
                    <div className="bg-card border border-border rounded-xl shadow-sm">
                      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground">Endereços</h3>
                        <Button size="sm" variant="outline" className="text-xs opacity-50 cursor-not-allowed" disabled>
                          Novo endereço
                        </Button>
                      </div>
                      <div className="divide-y divide-border">
                        {addresses.map((addr, idx) => (
                          <div key={idx}>
                            {/* Row */}
                            <div className="px-6 py-4 flex items-center gap-4">
                              <button
                                onClick={() => setExpandedAddress(expandedAddress === idx ? null : idx)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform ${expandedAddress === idx ? 'rotate-0' : '-rotate-90'}`}
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">{addr.label}</span>
                                  {addr.isDefault && (
                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 px-2 py-0">
                                      Padrão
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {addr.cidade}{addr.uf ? ` - ${addr.uf}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 opacity-50">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground cursor-not-allowed">
                                  <Pencil size={16} />
                                </div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground cursor-not-allowed">
                                  <Trash2 size={16} />
                                </div>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground cursor-not-allowed">
                                  <GripVertical size={16} />
                                </div>
                              </div>
                            </div>
                            {/* Expanded details */}
                            {expandedAddress === idx && (
                              <div className="px-6 pb-5 pl-14">
                                <p className="text-sm text-muted-foreground">{addr.nome}</p>
                                <p className="text-sm text-muted-foreground">{addr.logradouro},</p>
                                <p className="text-sm text-muted-foreground">{addr.cidade}{addr.uf ? `, ${addr.uf}` : ''}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Edit Address Dialog */}
                <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Atualizar Endereço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">
                          Logradouro <span className="text-destructive">*</span>
                        </label>
                        <Input value={editLogradouro} onChange={(e) => setEditLogradouro(e.target.value)} className="bg-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Complemento</label>
                        <Input value={editComplemento} onChange={(e) => setEditComplemento(e.target.value)} className="bg-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Bairro</label>
                        <Input value={editBairro} onChange={(e) => setEditBairro(e.target.value)} className="bg-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">
                          Cidade <span className="text-destructive">*</span>
                        </label>
                        <Input value={editCidade} onChange={(e) => setEditCidade(e.target.value)} className="bg-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">
                            UF <span className="text-destructive">*</span>
                          </label>
                          <Input value={editUf} onChange={(e) => setEditUf(e.target.value)} className="bg-transparent" maxLength={2} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">CEP</label>
                          <Input className="bg-transparent" placeholder="00000-000" />
                        </div>
                      </div>
                      <div className="flex justify-center gap-3 pt-3">
                        <Button variant="ghost" onClick={() => setEditAddressOpen(false)}>Descartar</Button>
                        <Button onClick={() => {
                          console.log('Salvar endereço', { editLogradouro, editComplemento, editBairro, editCidade, editUf });
                          setEditAddressOpen(false);
                        }}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* New Address Modal */}
                <Dialog open={newAddressOpen} onOpenChange={setNewAddressOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Adicionar novo endereço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        Informações de envio
                        <ChevronDown size={14} className="text-primary" />
                      </p>

                      <div>
                        <Label className="text-xs text-muted-foreground">Endereço Nome <span className="text-destructive">*</span></Label>
                        <Input value={newAddrNome} onChange={e => setNewAddrNome(e.target.value)} className="mt-1.5 bg-transparent" />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Endereço Linha 1 <span className="text-destructive">*</span></Label>
                        <Input value={newAddrLinha1} onChange={e => setNewAddrLinha1(e.target.value)} className="mt-1.5 bg-transparent" />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Linha de endereço 2</Label>
                        <Input value={newAddrLinha2} onChange={e => setNewAddrLinha2(e.target.value)} className="mt-1.5 bg-transparent" />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Cidade / Vila <span className="text-destructive">*</span></Label>
                        <Input value={newAddrCidade} onChange={e => setNewAddrCidade(e.target.value)} className="mt-1.5 bg-transparent" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Estado/Provincia <span className="text-destructive">*</span></Label>
                          <Input value={newAddrEstado} onChange={e => setNewAddrEstado(e.target.value)} className="mt-1.5 bg-transparent" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Código postal <span className="text-destructive">*</span></Label>
                          <Input value={newAddrCep} onChange={e => setNewAddrCep(e.target.value)} className="mt-1.5 bg-transparent" placeholder="00000-000" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">País <span className="text-destructive">*</span></Label>
                        <Select value={newAddrPais} onValueChange={setNewAddrPais}>
                          <SelectTrigger className="mt-1.5 bg-transparent">
                            <SelectValue placeholder="Selecione um país..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BR">Brasil</SelectItem>
                            <SelectItem value="US">Estados Unidos</SelectItem>
                            <SelectItem value="AR">Argentina</SelectItem>
                            <SelectItem value="PT">Portugal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-foreground">Utilizar como endereço de cobrança?</p>
                          <p className="text-xs text-muted-foreground">Se precisar de mais informações, consulte o planejamento orçamentário.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={newAddrCobranca} onCheckedChange={setNewAddrCobranca} />
                          <span className="text-xs text-muted-foreground">Sim</span>
                        </div>
                      </div>

                      <div className="flex justify-center gap-3 pt-3 border-t border-border">
                        <Button variant="ghost" onClick={() => setNewAddressOpen(false)}>Descartar</Button>
                        <Button onClick={() => {
                          if (!newAddrNome.trim() || !newAddrLinha1.trim() || !newAddrCidade.trim()) return;
                          setExtraAddresses(prev => [...prev, {
                            label: newAddrNome,
                            isDefault: false,
                            logradouro: `${newAddrLinha1}${newAddrLinha2 ? ', ' + newAddrLinha2 : ''}`,
                            cidade: newAddrCidade,
                            uf: newAddrEstado,
                            nome: newAddrNome,
                          }]);
                          setNewAddressOpen(false);
                        }}>
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* ===== Tab: Configurações Avançadas ===== */}
            {activeTab === 'Configurações Avançadas' && (
              <div className="space-y-6">
                {/* Detalhes de segurança */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                  <div className="p-6 sm:px-8">
                    <h3 className="text-base font-semibold text-foreground mb-5">Detalhes de segurança</h3>
                    <div className="divide-y divide-border">
                      <div className="flex items-center justify-between py-4 first:pt-0">
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-muted-foreground w-[100px]">Telefone</span>
                          {editingAdvPhone ? (
                            <Input value={advPhone} readOnly className="bg-transparent max-w-[200px] cursor-not-allowed opacity-70" />
                          ) : (
                            <span className="text-sm font-medium text-foreground">{advPhone || '+55 (11) 99999-9999'}</span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
                          <Pencil size={15} className="text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-4 last:pb-0">
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-muted-foreground w-[100px]">Senha</span>
                          {editingAdvPassword ? (
                            <Input type="password" value={advPassword} readOnly className="bg-transparent max-w-[200px] cursor-not-allowed opacity-70" />
                          ) : (
                            <span className="text-sm font-medium text-foreground">******</span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed">
                          <Pencil size={15} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Autenticação em duas etapas */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                  <div className="p-6 sm:px-8">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Autenticação em duas etapas</h3>
                        <p className="text-sm text-muted-foreground mt-1">Mantenha sua conta ainda mais segura com uma segunda etapa de autenticação.</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 flex-shrink-0">
                        <Shield size={14} />
                        Adicionar etapa de autenticação
                      </Button>
                    </div>
                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">SMS</p>
                          {editingAdvSms ? (
                            <Input value={advSmsNumber} onChange={e => setAdvSmsNumber(e.target.value)} className="bg-transparent max-w-[200px] mt-1" autoFocus onBlur={() => setEditingAdvSms(false)} onKeyDown={e => e.key === 'Enter' && setEditingAdvSms(false)} />
                          ) : (
                            <p className="text-sm text-muted-foreground">{advSmsNumber || '+55 (11) 99999-9999'}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingAdvSms(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                            <Pencil size={15} className="text-muted-foreground" />
                          </button>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors">
                            <Trash2 size={15} className="text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Caso perca seu dispositivo móvel ou chave de segurança, você pode <span className="text-primary hover:underline cursor-pointer">gerar um código de backup</span> para acessar sua conta.
                    </p>
                  </div>
                </div>

                {/* Métodos de pagamento */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                  <div className="p-6 sm:px-8">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-foreground">Métodos de pagamento</h3>
                      <Button variant="outline" size="sm" className="text-xs">Adicionar novo método</Button>
                    </div>
                    <div className="divide-y divide-border">
                      {paymentMethods.map((card, idx) => (
                        <div key={card.id}>
                          <div className="flex items-center gap-4 py-4">
                            <button onClick={() => setExpandedCard(expandedCard === idx ? null : idx)} className="text-muted-foreground hover:text-foreground transition-colors">
                              <ChevronDown size={16} className={`transition-transform ${expandedCard === idx ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                            <div className="w-10 h-7 rounded border border-border flex items-center justify-center text-[10px] font-bold text-foreground bg-muted">
                              {card.brand === 'MasterCard' ? '💳' : card.brand === 'Visa' ? '💳' : '💳'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{card.brand}</span>
                                {card.isPrimary && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 px-2 py-0">Primário</Badge>}
                                {card.expired && <Badge variant="destructive" className="text-[10px] px-2 py-0">Expirado</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">Expira em {card.expiry}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                                <Pencil size={15} className="text-muted-foreground" />
                              </button>
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors">
                                <Trash2 size={15} className="text-muted-foreground" />
                              </button>
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                                <GripVertical size={15} className="text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          {expandedCard === idx && card.brand === 'MasterCard' && (
                            <div className="pb-5 pl-14 grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
                              <div className="flex gap-3"><span className="text-muted-foreground">Nome</span><span className="font-medium text-foreground">Emma Smith</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Endereço de Cobrança</span><span className="font-medium text-foreground">AU</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Número</span><span className="font-medium text-foreground">**** {card.lastFour}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Telefone</span><span className="font-medium text-foreground">{card.phone}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Expira</span><span className="font-medium text-foreground">{card.expiry}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">E-mail</span><span className="font-medium text-primary">{card.email}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Tipo</span><span className="font-medium text-foreground">{card.type}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Origem</span><span className="font-medium text-foreground">{card.origin}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Emissor</span><span className="font-medium text-foreground">{card.issuer}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">Verificação CVC</span><span className="font-medium text-foreground">{card.cvc}</span></div>
                              <div className="flex gap-3"><span className="text-muted-foreground">EU IA</span><span className="font-medium text-foreground">{card.euIa}</span></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save all button */}
                <div className="flex justify-end">
                  <Button onClick={() => {
                    toast({ title: 'Configurações salvas!', description: 'Todas as configurações avançadas foram salvas.' });
                    setActiveTab('Visão Geral');
                  }}>
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default ClienteDetalhe;
