import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCep } from '@/hooks/use-cep';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Search, X, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/auth-refresh';

/* ─── types ─── */
interface CatalogoItem {
  pro_codpro: number;
  pro_despro: string;
  pro_foto: string;
  NOME_GRUPO: string | null;
  SALDOS: string;
}

interface ClienteAPI {
  ter_codter: number;
  ter_nomter: string;
  ter_fanter?: string;
  ter_documento?: string;
  TEN_CIDLGR?: string;
  TEN_UF_LGR?: string;
}

interface CartItem extends CatalogoItem {
  quantidade: number;
  preco_unitario: number;
}

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE = `https://${projectId}.supabase.co/functions/v1`;

const fmt = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CriarPedido = () => {
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
  const [step, setStep] = useState(0);
  const [pedidoNumero, setPedidoNumero] = useState('');

  /* cliente */
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteAPI | null>(null);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  /* catalogo */
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [catalogoPage, setCatalogoPage] = useState(1);
  const [hasMoreCatalogo, setHasMoreCatalogo] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  /* carrinho */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [descontoType, setDescontoType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [descontoPercent, setDescontoPercent] = useState(0);
  const [descontoFixed, setDescontoFixed] = useState(0);
  const [frete, setFrete] = useState(0);

  const representante = 'REPRESENTANTE ONLINE';

  /* ─── fetch clientes ─── */
  const fetchClientes = useCallback(async (search: string) => {
    setLoadingClientes(true);
    try {
      const res = await fetch(`${BASE}/fetch-clients?page=1&limit=50`);
      const data = await res.json();
      const all: ClienteAPI[] = data?.clients || [];
      if (!search.trim()) { setClientes(all); return; }
      const q = search.toLowerCase();
      setClientes(all.filter(c =>
        (c.ter_nomter || '').toLowerCase().includes(q) ||
        String(c.ter_codter).includes(q) ||
        (c.ter_documento || '').includes(q)
      ));
    } catch { setClientes([]); }
    finally { setLoadingClientes(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchClientes(clienteSearch), 300);
    return () => clearTimeout(t);
  }, [clienteSearch, fetchClientes]);

  /* ─── fetch catalogo on mount ─── */
  const fetchCatalogo = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoadingCatalogo(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`${BASE}/fetch-catalogo?page=${page}&limit=50`);
      const data = await res.json();
      const items: CatalogoItem[] = data?.catalogs || [];
      if (append) {
        setCatalogo(prev => [...prev, ...items]);
      } else {
        setCatalogo(items);
      }
      setHasMoreCatalogo(items.length >= 50);
      setCatalogoPage(page);
    } catch { if (!append) setCatalogo([]); }
    finally { setLoadingCatalogo(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchCatalogo(1); }, [fetchCatalogo]);

  const loadMoreCatalogo = () => {
    if (!loadingMore && hasMoreCatalogo) {
      fetchCatalogo(catalogoPage + 1, true);
    }
  };

  /* ─── cart ops ─── */
  const toggleProduct = (item: CatalogoItem) => {
    const existing = cart.find(c => c.pro_codpro === item.pro_codpro);
    if (existing) {
      setCart(prev => prev.filter(c => c.pro_codpro !== item.pro_codpro));
    } else {
      setCart(prev => [...prev, { ...item, quantidade: 1, preco_unitario: 0 }]);
      toast({ title: 'Produto adicionado', description: item.pro_despro });
    }
  };

  const updateQty = (codpro: number, delta: number) => {
    setCart(prev => prev.map(c => c.pro_codpro !== codpro ? c : { ...c, quantidade: Math.max(1, c.quantidade + delta) }));
  };

  const removeFromCart = (codpro: number) => setCart(prev => prev.filter(c => c.pro_codpro !== codpro));

  const updatePrice = (codpro: number, price: number) => {
    setCart(prev => prev.map(c => c.pro_codpro === codpro ? { ...c, preco_unitario: price } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.quantidade * c.preco_unitario, 0);
  const desconto = descontoType === 'percent'
    ? subtotal * (descontoPercent / 100)
    : descontoType === 'fixed'
      ? descontoFixed
      : 0;
  const total = Math.max(0, subtotal - desconto + frete);

  const getImageUrl = (filename: string) => `${BASE}/proxy-image?file=${encodeURIComponent(filename)}`;

  const filteredCatalogo = produtoSearch.trim()
    ? catalogo.filter(c => {
        const q = produtoSearch.toLowerCase();
        return (c.pro_despro || '').toLowerCase().includes(q) || String(c.pro_codpro).includes(q);
      })
    : catalogo;

  const [enviando, setEnviando] = useState(false);

  /* ─── delivery address state ─── */
  const [billingAddr, setBillingAddr] = useState({ line1: '', line2: '', city: '', postcode: '', state: '', country: '' });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddr, setShippingAddr] = useState({ line1: '', line2: '', city: '', postcode: '', state: '', country: '' });

  const handleBillingCep = useCallback((d: any) => {
    setBillingAddr(p => ({ ...p, line1: d.logradouro || p.line1, line2: d.bairro || p.line2, city: d.localidade || p.city, state: d.uf || p.state, country: 'Brasil' }));
  }, []);
  const handleShippingCep = useCallback((d: any) => {
    setShippingAddr(p => ({ ...p, line1: d.logradouro || p.line1, line2: d.bairro || p.line2, city: d.localidade || p.city, state: d.uf || p.state, country: 'Brasil' }));
  }, []);
  const { fetchCep: fetchBillingCep, loading: billingCepLoading } = useCep(handleBillingCep);
  const { fetchCep: fetchShippingCep, loading: shippingCepLoading } = useCep(handleShippingCep);

  const handleEnviarPedido = async () => {
    if (!selectedCliente || cart.length === 0) return;
    setEnviando(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        date_ini: '2000-01-01',
        date_end: '2100-12-31',
      });

      const res = await fetchWithAuth(`${BASE}/fetch-orders?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(`Falha ao buscar último pedido (${res.status})`);

      const ordData = await res.json();
      const orders = Array.isArray(ordData?.orders) ? ordData.orders : [];
      const lastOrderNumber = orders
        .map((order: { orc_codorc_web?: number | string }) => Number(order.orc_codorc_web))
        .filter((value: number) => Number.isFinite(value) && value > 0)
        .reduce((max: number, value: number) => Math.max(max, value), 0);

      if (!lastOrderNumber) throw new Error('Nenhum pedido válido retornado pela API');

      setPedidoNumero(String(lastOrderNumber + 1));
      setStep(2);
      toast({ title: 'Pedido enviado com sucesso!' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao gerar número do pedido', description: 'Não foi possível buscar o último pedido da API.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  /* ─── render ─── */
  return (
    <>
      {/* Hero banner - same pattern as other pages */}
      <div className="relative overflow-hidden bg-[hsl(var(--erp-banner))]">
        <div className="absolute inset-x-0 top-0 h-[70px] bg-[hsl(var(--erp-banner))]" />
        <div className="h-[70px]" />
        <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-8 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-primary-foreground">Criar Pedido</h1>
            <div className="flex items-center gap-2 text-xs text-primary-foreground/60 mt-1">
              <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">Home</button>
              <ChevronRight size={12} />
              <button onClick={() => navigate('/pedidos')} className="hover:text-primary-foreground transition-colors">Pedidos</button>
              <ChevronRight size={12} />
              <span className="text-primary-foreground/90">Criar Pedido</span>
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

      <main className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 space-y-4 sm:space-y-5 -mt-16 sm:-mt-24 relative z-10 max-w-[1600px] mx-auto w-full">

        {/* ═══════════════ STEP 0: Two-column layout ═══════════════ */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* LEFT CARD: Order Details — Metronic style */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 pb-0">
                  <h2 className="text-lg font-bold text-foreground">Detalhes do Pedido</h2>
                </div>
                <div className="p-6 space-y-6">

                  {/* Cliente */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Cliente <span className="text-destructive">*</span>
                    </label>
                    {selectedCliente ? (
                      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 text-sm bg-transparent">
                        <span className="font-medium flex-1 truncate">{selectedCliente.ter_codter} — {selectedCliente.ter_nomter}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => { setSelectedCliente(null); setClienteSearch(''); }}>
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input value={clienteSearch}
                          onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true); }}
                          onDoubleClick={() => { fetchClientes(''); setShowClienteDropdown(true); }}
                          onFocus={() => { if (clienteSearch.length >= 2) setShowClienteDropdown(true); }}
                          onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                          placeholder="Selecione um cliente" className="h-10 text-sm rounded-lg" />
                        {showClienteDropdown && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {loadingClientes ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">Buscando...</div>
                            ) : clientes.length === 0 ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">Nenhum encontrado</div>
                            ) : clientes.map(c => (
                              <button key={c.ter_codter} className="w-full text-left px-3 py-2.5 hover:bg-accent/50 text-sm border-b border-border last:border-0 transition-colors"
                                onClick={() => { setSelectedCliente(c); setShowClienteDropdown(false); setClienteSearch(''); }}>
                                <div className="font-medium">{c.ter_codter} — {c.ter_nomter}</div>
                                <div className="text-xs text-muted-foreground">{c.ter_documento || ''} {c.TEN_CIDLGR ? `· ${c.TEN_CIDLGR}` : ''}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">Selecione o cliente do pedido.</p>
                  </div>

                  {/* Representante */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Representante <span className="text-destructive">*</span>
                    </label>
                    <div className="border border-border rounded-lg px-3 py-2.5 text-sm bg-transparent text-foreground">{representante}</div>
                    <p className="text-xs text-muted-foreground mt-1.5">Representante responsável pelo pedido.</p>
                  </div>

                  {/* Tipo de Desconto */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Tipo de Desconto
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'none', label: 'Sem Desconto' },
                        { value: 'percent', label: 'Percentual %' },
                        { value: 'fixed', label: 'Preço Fixo' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDescontoType(opt.value)}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-[11px] leading-tight font-medium text-center transition-colors ${
                            descontoType === opt.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            descontoType === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {descontoType === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </span>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Percentage slider */}
                    {descontoType === 'percent' && (
                      <div className="mt-4 space-y-3">
                        <label className="text-xs font-medium text-muted-foreground block">Percentual de Desconto</label>
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-3xl font-bold text-foreground">{descontoPercent}</span>
                          <span className="text-lg text-muted-foreground">%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={descontoPercent}
                          onChange={e => setDescontoPercent(Number(e.target.value))}
                          className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0%</span><span>50%</span><span>100%</span>
                        </div>
                      </div>
                    )}

                    {/* Fixed value input */}
                    {descontoType === 'fixed' && (
                      <div className="mt-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Valor do Desconto</label>
                        <Input type="number" value={descontoFixed || ''} onChange={e => setDescontoFixed(parseFloat(e.target.value) || 0)}
                          className="h-10 text-sm rounded-lg" placeholder="0,00" step="0.01" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advance button */}
              {cart.length > 0 && (
                <Button
                  className="w-full font-bold bg-[hsl(var(--erp-navy))] hover:bg-[hsl(var(--erp-navy))]/90 text-white rounded-lg h-11"
                  disabled={!selectedCliente}
                  onClick={() => setStep(1)}
                >
                  Avançar para Resumo
                </Button>
              )}
            </div>

            {/* RIGHT CARD: Select Products */}
            <div className="lg:col-span-9">
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="px-5 py-4">
                  <h2 className="text-base font-bold text-foreground">Selecionar Produtos</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Adicione produtos a este pedido</p>
                </div>

                {/* Selected products cards (Metronic style) */}
                {cart.length > 0 && (
                  <div className="px-5 pb-4 flex flex-wrap gap-3">
                    {cart.map(item => (
                      <div key={item.pro_codpro} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {item.pro_foto ? (
                            <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : <div className="w-full h-full" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{item.pro_despro}</div>
                          <div className="text-xs text-muted-foreground">Preço: {fmt(item.preco_unitario)} · SKU: {item.pro_codpro}</div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 ml-2" onClick={() => removeFromCart(item.pro_codpro)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Cost */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">
                    Custo Total: <span className="text-[hsl(var(--erp-green))]">{fmt(subtotal)}</span>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-5 pb-3">
                  <div className="relative w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <Input value={produtoSearch}
                      onChange={e => setProdutoSearch(e.target.value)}
                      placeholder="Pesquisar Produtos"
                      className="pl-10 h-11 text-sm rounded-lg bg-muted/40 border-transparent focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50" />
                  </div>
                </div>

                {/* Products list */}
                <div className="overflow-y-auto max-h-[60vh]">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                    <div className="col-span-1"></div>
                    <div className="col-span-7">Produto</div>
                    <div className="col-span-2 text-center">Preço Un.</div>
                    <div className="col-span-2 text-right">Saldo</div>
                  </div>

                  {loadingCatalogo ? (
                    <div className="py-12 flex justify-center"><Spinner /></div>
                  ) : filteredCatalogo.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado</div>
                  ) : (
                    filteredCatalogo.map(item => {
                      const inCart = cart.find(c => c.pro_codpro === item.pro_codpro);
                      const saldo = parseInt(item.SALDOS) || 0;
                      const lowStock = saldo > 0 && saldo <= 10;
                      return (
                        <div
                          key={item.pro_codpro}
                          className={`grid grid-cols-12 gap-3 px-5 py-5 border-b border-border/30 items-center hover:bg-accent/30 transition-colors cursor-pointer ${inCart ? 'bg-accent/20' : ''}`}
                          onClick={() => toggleProduct(item)}
                        >
                          <div className="col-span-1 flex items-center justify-center">
                            <Checkbox checked={!!inCart} onClick={e => e.stopPropagation()} onCheckedChange={() => toggleProduct(item)} />
                          </div>
                          <div className="col-span-7 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              {item.pro_foto ? (
                                <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : <div className="w-full h-full" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{item.pro_despro}</div>
                              <div className="text-xs text-muted-foreground">SKU: {item.pro_codpro}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            {inCart ? (
                              <Input
                                type="number"
                                value={inCart.preco_unitario || ''}
                                onChange={e => { e.stopPropagation(); updatePrice(item.pro_codpro, parseFloat(e.target.value) || 0); }}
                                onClick={e => e.stopPropagation()}
                                className="w-20 h-7 text-xs mx-auto rounded"
                                placeholder="0,00"
                                step="0.01"
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            {lowStock ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] font-semibold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Low stock</span>
                                <span className="text-sm text-destructive font-semibold">{saldo}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-foreground">{saldo || '—'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Load more */}
                  {hasMoreCatalogo && !produtoSearch.trim() && (
                    <div className="px-5 py-4 flex justify-center">
                      <Button variant="outline" className="rounded-lg text-sm" onClick={loadMoreCatalogo} disabled={loadingMore}>
                        {loadingMore ? 'Carregando...' : 'Carregar mais produtos'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 1: Resumo do Pedido ═══════════════ */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left: items */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Itens do Pedido</h2>
                <span className="text-xs text-muted-foreground">{cart.length} itens</span>
              </div>

              <div className="divide-y divide-border">
                {cart.map(item => (
                  <div key={item.pro_codpro} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.pro_foto ? (
                        <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : <div className="w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.pro_despro}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.pro_codpro}</div>
                    </div>
                    <div className="flex items-center gap-1 border border-border rounded-lg">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, -1)}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantidade}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, 1)}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    <div className="text-sm font-medium w-24 text-right">{fmt(item.quantidade * item.preco_unitario)}</div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => removeFromCart(item.pro_codpro)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Detalhes de Entrega</h2>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-4">Endereço de Cobrança</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Endereço 1 <span className="text-destructive">*</span></label>
                      <Input placeholder="Endereço 1" className="h-10 text-sm rounded-lg" value={billingAddr.line1} onChange={e => setBillingAddr(p => ({ ...p, line1: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Endereço 2</label>
                      <Input placeholder="Endereço 2" className="h-10 text-sm rounded-lg" value={billingAddr.line2} onChange={e => setBillingAddr(p => ({ ...p, line2: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Cidade</label>
                      <Input className="h-10 text-sm rounded-lg" value={billingAddr.city} onChange={e => setBillingAddr(p => ({ ...p, city: e.target.value }))} />
                    </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">CEP <span className="text-destructive">*</span></label>
                        <Input className="h-10 text-sm rounded-lg" value={billingAddr.postcode}
                          onChange={e => setBillingAddr(p => ({ ...p, postcode: e.target.value }))}
                          onBlur={() => fetchBillingCep(billingAddr.postcode)}
                          placeholder="00000-000" />
                        {billingCepLoading && <span className="text-[10px] text-muted-foreground">Buscando...</span>}
                      </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Estado <span className="text-destructive">*</span></label>
                      <Input className="h-10 text-sm rounded-lg" value={billingAddr.state} onChange={e => setBillingAddr(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-foreground mb-1.5 block">País <span className="text-destructive">*</span></label>
                    <Input placeholder="Brasil" className="h-10 text-sm rounded-lg" value={billingAddr.country} onChange={e => setBillingAddr(p => ({ ...p, country: e.target.value }))} />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 py-1">
                  <Checkbox checked={sameAsBilling} onCheckedChange={(v) => setSameAsBilling(!!v)} />
                  <label className="text-sm text-muted-foreground cursor-pointer" onClick={() => setSameAsBilling(!sameAsBilling)}>
                    Endereço de entrega é o mesmo que o de cobrança
                  </label>
                </div>

                {!sameAsBilling && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-4">Endereço de Entrega</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Endereço 1</label>
                        <Input placeholder="Endereço 1" className="h-10 text-sm rounded-lg" value={shippingAddr.line1} onChange={e => setShippingAddr(p => ({ ...p, line1: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Endereço 2</label>
                        <Input placeholder="Endereço 2" className="h-10 text-sm rounded-lg" value={shippingAddr.line2} onChange={e => setShippingAddr(p => ({ ...p, line2: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Cidade</label>
                        <Input className="h-10 text-sm rounded-lg" value={shippingAddr.city} onChange={e => setShippingAddr(p => ({ ...p, city: e.target.value }))} />
                      </div>
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1.5 block">CEP</label>
                          <Input className="h-10 text-sm rounded-lg" value={shippingAddr.postcode}
                            onChange={e => setShippingAddr(p => ({ ...p, postcode: e.target.value }))}
                            onBlur={() => fetchShippingCep(shippingAddr.postcode)}
                            placeholder="00000-000" />
                          {shippingCepLoading && <span className="text-[10px] text-muted-foreground">Buscando...</span>}
                        </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">Estado</label>
                        <Input className="h-10 text-sm rounded-lg" value={shippingAddr.state} onChange={e => setShippingAddr(p => ({ ...p, state: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-xs font-medium text-foreground mb-1.5 block">País</label>
                      <Input placeholder="Brasil" className="h-10 text-sm rounded-lg" value={shippingAddr.country} onChange={e => setShippingAddr(p => ({ ...p, country: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-base text-foreground">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor dos produtos ({cart.length}):</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="text-destructive font-medium">- {fmt(desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="text-[hsl(var(--erp-green))] font-bold">{frete > 0 ? fmt(frete) : 'Grátis'}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-[hsl(var(--erp-green))]">{fmt(total)}</span>
                </div>
              </div>

              {selectedCliente && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-2">
                  <h3 className="font-bold text-sm text-foreground">Cliente</h3>
                  <div className="text-sm">{selectedCliente.ter_codter} — {selectedCliente.ter_nomter}</div>
                  {selectedCliente.ter_documento && <div className="text-xs text-muted-foreground">{selectedCliente.ter_documento}</div>}
                  {selectedCliente.TEN_CIDLGR && <div className="text-xs text-muted-foreground">{selectedCliente.TEN_CIDLGR} {selectedCliente.TEN_UF_LGR ? `- ${selectedCliente.TEN_UF_LGR}` : ''}</div>}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full font-bold rounded-lg h-11 text-base bg-[hsl(var(--erp-navy))] hover:bg-[hsl(var(--erp-navy))]/90 text-white"
                  onClick={handleEnviarPedido}
                  disabled={enviando}
                >
                  {enviando ? 'Enviando...' : 'Enviar Pedido'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-bold rounded-lg h-11 text-base"
                  onClick={() => setStep(0)}
                >
                  VOLTAR
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: Confirmação ═══════════════ */}
        {step === 2 && (
          <div className="flex items-center justify-center py-12">
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center max-w-md w-full space-y-5">
              <div className="flex justify-center">
                <CheckCircle2 size={64} className="text-[hsl(var(--erp-green))]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Pedido Enviado!</h2>
                <p className="text-sm text-muted-foreground mt-1">Seu pedido foi enviado com sucesso.</p>
              </div>

              <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Pedido nº:</span>
                  <span className="font-mono">{pedidoNumero}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Cliente:</span>
                  <span>{selectedCliente?.ter_nomter}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="text-sm font-semibold">Total:</span>
                <span className="text-xl font-bold">{fmt(total)}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20 rounded-lg" onClick={() => navigate('/pedidos')}>
                  Ver pedidos
                </Button>
                <Button className="flex-1 bg-[hsl(var(--erp-navy))] hover:bg-[hsl(var(--erp-navy))]/90 rounded-lg" onClick={() => { setStep(0); setCart([]); setSelectedCliente(null); setDescontoType('none'); setDescontoPercent(0); setDescontoFixed(0); setFrete(0); }}>
                  Nova compra
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default CriarPedido;
