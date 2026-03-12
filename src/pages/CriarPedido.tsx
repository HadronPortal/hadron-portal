import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Search, X, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  /* carrinho */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [desconto, setDesconto] = useState(0);
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
  const fetchCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const res = await fetch(`${BASE}/fetch-catalogo?page=1&limit=100`);
      const data = await res.json();
      setCatalogo(data?.catalogs || []);
    } catch { setCatalogo([]); }
    finally { setLoadingCatalogo(false); }
  }, []);

  useEffect(() => { fetchCatalogo(); }, [fetchCatalogo]);

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
  const total = subtotal - desconto + frete;

  const getImageUrl = (filename: string) => `${BASE}/proxy-image?file=${encodeURIComponent(filename)}`;

  const filteredCatalogo = produtoSearch.trim()
    ? catalogo.filter(c => {
        const q = produtoSearch.toLowerCase();
        return (c.pro_despro || '').toLowerCase().includes(q) || String(c.pro_codpro).includes(q);
      })
    : catalogo;

  const [enviando, setEnviando] = useState(false);

  const handleEnviarPedido = async () => {
    if (!selectedCliente || cart.length === 0) return;
    setEnviando(true);
    try {
      const num = Math.floor(100000 + Math.random() * 900000).toString();
      await new Promise(resolve => setTimeout(resolve, 500));
      setPedidoNumero(num);
      setStep(2);
      toast({ title: 'Pedido enviado com sucesso!' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao enviar pedido', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  /* ─── render ─── */
  return (
    <>
      {/* Metronic-style page header with gradient */}
      <div className="bg-gradient-to-r from-[hsl(var(--erp-navy))] to-[hsl(var(--erp-blue))] px-4 sm:px-8 py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Criar Pedido</h1>
        <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
          <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button>
          <ChevronRight size={12} />
          <button onClick={() => navigate('/pedidos')} className="hover:text-white transition-colors">Pedidos</button>
          <ChevronRight size={12} />
          <span className="text-white/90">Criar Pedido</span>
        </div>
      </div>

      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 sm:py-6">

        {/* ═══════════════ STEP 0: Two-column layout ═══════════════ */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto">

            {/* LEFT CARD: Order Details — Metronic style */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 border-l-[hsl(var(--erp-blue))]">
                <div className="p-6 pb-0">
                  <h2 className="text-lg font-bold text-foreground">Detalhes do Pedido</h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Order ID */}
                  <div>
                    <span className="text-xs text-muted-foreground">Nº Pedido</span>
                    <div className="text-xl font-bold text-foreground mt-0.5">#{Math.floor(10000 + Math.random() * 90000)}</div>
                  </div>

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

                  {/* Desconto */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Desconto
                    </label>
                    <Input type="number" value={desconto || ''} onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                      className="h-10 text-sm rounded-lg" placeholder="0,00" step="0.01" />
                    <p className="text-xs text-muted-foreground mt-1.5">Insira o valor do desconto, se houver.</p>
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
                <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm font-bold text-foreground">
                    Custo Total: <span className="text-[hsl(var(--erp-green))]">{fmt(subtotal)}</span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={produtoSearch}
                      onChange={e => setProdutoSearch(e.target.value)}
                      placeholder="Buscar produtos..." className="pl-9 h-9 text-sm rounded-lg" />
                  </div>
                </div>

                {/* Products list */}
                <div className="overflow-y-auto max-h-[60vh]">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
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
                          className={`grid grid-cols-12 gap-2 px-5 py-3 border-b border-border items-center hover:bg-accent/30 transition-colors cursor-pointer ${inCart ? 'bg-accent/20' : ''}`}
                          onClick={() => toggleProduct(item)}
                        >
                          <div className="col-span-1 flex items-center justify-center">
                            <Checkbox checked={!!inCart} onCheckedChange={() => toggleProduct(item)} />
                          </div>
                          <div className="col-span-7 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
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

              {/* Totals */}
              <div className="px-5 py-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto:</span>
                    <span className="text-destructive font-medium">- {fmt(desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span className="font-medium">{frete > 0 ? fmt(frete) : 'Grátis'}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[hsl(var(--erp-green))]">{fmt(total)}</span>
                </div>
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
                  className="w-full font-bold rounded-lg h-11 text-base bg-[hsl(var(--erp-amber))] hover:bg-[hsl(var(--erp-amber))]/90 text-foreground"
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
                <Button variant="outline" className="flex-1 border-[hsl(var(--erp-navy))] text-[hsl(var(--erp-navy))] hover:bg-[hsl(var(--erp-navy))]/5 rounded-lg" onClick={() => navigate('/pedidos')}>
                  Ver pedidos
                </Button>
                <Button className="flex-1 bg-[hsl(var(--erp-navy))] hover:bg-[hsl(var(--erp-navy))]/90 rounded-lg" onClick={() => { setStep(0); setCart([]); setSelectedCliente(null); setDesconto(0); setFrete(0); }}>
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
