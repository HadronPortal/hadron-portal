import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Minus, Search, ArrowLeft, X, Trash2, CheckCircle2 } from 'lucide-react';
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
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false);

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
  const addToCart = (item: CatalogoItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.pro_codpro === item.pro_codpro);
      if (existing) return prev.map(c => c.pro_codpro === item.pro_codpro ? { ...c, quantidade: c.quantidade + 1 } : c);
      return [...prev, { ...item, quantidade: 1, preco_unitario: 0 }];
    });
    toast({ title: 'Produto adicionado', description: item.pro_despro });
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
      // Apenas simula o envio sem salvar no banco
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
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Criar Pedido</h1>
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Rep: {representante}</span>
        </div>

        {/* ═══════════════ STEP 1: Lista de Produtos ═══════════════ */}
        {step === 0 && (
          <div className="bg-card rounded-lg border border-border shadow-sm max-w-3xl mx-auto">
            {/* Header with search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-border gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Itens do Pedido</h2>
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={produtoSearch}
                  onChange={e => { setProdutoSearch(e.target.value); setShowProdutoDropdown(true); }}
                  onDoubleClick={() => setShowProdutoDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProdutoDropdown(false), 200)}
                  placeholder="Buscar produtos" className="pl-9 h-9 text-sm" />
                {showProdutoDropdown && (
                  <div className="absolute z-50 top-full mt-1 w-80 right-0 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {loadingCatalogo ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">Buscando...</div>
                    ) : filteredCatalogo.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">Nenhum produto encontrado</div>
                    ) : (
                      filteredCatalogo.slice(0, 20).map(item => {
                        const inCart = cart.some(c => c.pro_codpro === item.pro_codpro);
                        return (
                          <button
                            key={item.pro_codpro}
                            className="w-full text-left px-3 py-2.5 hover:bg-accent/30 transition-colors border-b border-border last:border-0 flex items-center gap-3"
                            onClick={() => { addToCart(item); setProdutoSearch(''); setShowProdutoDropdown(false); }}
                          >
                            <div className="w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden">
                              {item.pro_foto ? (
                                <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : <div className="w-full h-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.pro_despro}</div>
                              <div className="text-xs text-muted-foreground font-mono">{item.pro_codpro}</div>
                            </div>
                            {inCart && <span className="text-xs text-erp-green font-medium">✓ No carrinho</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cliente row */}
            <div className="px-5 py-3 border-b border-border">
              <div className="max-w-sm relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cliente *</label>
                {selectedCliente ? (
                  <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm">
                    <span className="font-medium">{selectedCliente.ter_codter} — {selectedCliente.ter_nomter}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={() => { setSelectedCliente(null); setClienteSearch(''); }}>
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
                      placeholder="Buscar cliente..." className="h-8 text-sm" />
                    {showClienteDropdown && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {loadingClientes ? (
                          <div className="p-2 text-center text-xs text-muted-foreground">Buscando...</div>
                        ) : clientes.length === 0 ? (
                          <div className="p-2 text-center text-xs text-muted-foreground">Nenhum encontrado</div>
                        ) : clientes.map(c => (
                          <button key={c.ter_codter} className="w-full text-left px-3 py-2 hover:bg-accent/30 text-sm border-b border-border last:border-0"
                            onClick={() => { setSelectedCliente(c); setShowClienteDropdown(false); setClienteSearch(''); }}>
                            <div className="font-medium">{c.ter_codter} — {c.ter_nomter}</div>
                            <div className="text-xs text-muted-foreground">{c.ter_documento || ''} {c.TEN_CIDLGR ? `· ${c.TEN_CIDLGR}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Products table (cart items) */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground">Produto</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">SKU</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Preço</TableHead>
                    <TableHead className="text-xs font-bold text-foreground w-28">Qtd</TableHead>
                    <TableHead className="text-xs font-bold text-foreground text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-sm">
                        —
                      </TableCell>
                    </TableRow>
                  ) : cart.map(item => (
                    <TableRow key={`cart-${item.pro_codpro}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {item.pro_foto ? (
                              <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : <div className="w-full h-full" />}
                          </div>
                          <span className="text-sm font-medium">{item.pro_despro}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{item.pro_codpro}</TableCell>
                      <TableCell className="text-sm">
                        <Input type="number" value={item.preco_unitario || ''} onChange={e => updatePrice(item.pro_codpro, parseFloat(e.target.value) || 0)}
                          className="w-20 h-7 text-xs" placeholder="0,00" step="0.01" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 border border-border rounded-md w-fit">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, -1)}>
                            <Minus size={12} />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantidade}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, 1)}>
                            <Plus size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFromCart(item.pro_codpro)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center justify-end">
              {cart.length > 0 && (
                <Button className="bg-erp-navy hover:bg-erp-navy/90 gap-2" disabled={!selectedCliente} onClick={() => setStep(1)}>
                  Avançar para Resumo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: Resumo do Pedido ═══════════════ */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: items */}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Resumo do Pedido</h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-foreground">Produto</TableHead>
                      <TableHead className="text-xs font-bold text-foreground text-center">Qtd</TableHead>
                      <TableHead className="text-xs font-bold text-foreground text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.pro_codpro}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                              {item.pro_foto ? (
                                <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : <div className="w-full h-full" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{item.pro_despro}</div>
                              <div className="text-xs text-muted-foreground font-mono">{item.pro_codpro}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1 border border-border rounded-md w-fit mx-auto">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, -1)}>
                              <Minus size={12} />
                            </Button>
                            <span className="w-6 text-center text-sm">{item.quantidade}</span>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.pro_codpro, 1)}>
                              <Plus size={12} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {fmt(item.quantidade * item.preco_unitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="text-destructive font-medium">- {fmt(desconto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span className="font-medium">{fmt(frete)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Right: Summary sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-card rounded-lg border border-border shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-base text-foreground">Resumo do pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor dos produtos ({cart.length}):</span>
                    <span className="text-foreground">{fmt(subtotal)}</span>
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="text-destructive font-medium">- {fmt(desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="text-erp-green font-bold">{frete > 0 ? fmt(frete) : 'Grátis'}</span>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-muted-foreground">Tem desconto?</label>
                    <Input type="number" value={desconto || ''} onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                      className="h-8 mt-1 text-sm"
                      placeholder="0,00" step="0.01" />
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-lg text-foreground">
                    <span>Total:</span>
                    <span className="text-erp-green">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full font-bold rounded-md py-3 text-base bg-erp-navy hover:bg-erp-navy/90 text-primary-foreground"
                  onClick={handleEnviarPedido}
                  disabled={enviando}
                >
                  {enviando ? 'Enviando...' : 'CONTINUAR'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-bold rounded-md py-3 text-base border-border text-muted-foreground hover:bg-muted"
                  onClick={() => setStep(0)}
                >
                  VOLTAR
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 3: Confirmação ═══════════════ */}
        {step === 2 && (
          <div className="flex items-center justify-center py-12">
            <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center max-w-md w-full space-y-5">
              <div className="flex justify-center">
                <CheckCircle2 size={64} className="text-erp-green" />
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
                <Button variant="outline" className="flex-1 border-erp-navy text-erp-navy hover:bg-erp-navy/5" onClick={() => navigate('/pedidos')}>
                  Ver pedidos
                </Button>
                <Button className="flex-1 bg-erp-navy hover:bg-erp-navy/90" onClick={() => { setStep(0); setCart([]); setSelectedCliente(null); setDesconto(0); setFrete(0); }}>
                  Nova compra
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CriarPedido;
