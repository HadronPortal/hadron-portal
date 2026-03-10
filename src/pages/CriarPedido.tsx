import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/erp/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Minus, Trash2, Search, ShoppingCart, ArrowLeft, X } from 'lucide-react';
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

/* ─── steps ─── */
const steps = ['Carrinho', 'Checkout', 'Pedido'] as const;

const CriarPedido = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  /* cliente */
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteAPI | null>(null);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  /* catalogo / produtos */
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);

  /* carrinho */
  const [cart, setCart] = useState<CartItem[]>([]);

  /* representante (mock logged-in) */
  const representante = 'REPRESENTANTE ONLINE';

  /* ─── fetch clientes ─── */
  const fetchClientes = useCallback(async (search: string) => {
    if (search.length < 2) { setClientes([]); return; }
    setLoadingClientes(true);
    try {
      const res = await fetch(`${BASE}/fetch-clients?page=1&limit=20`);
      const data = await res.json();
      const all: ClienteAPI[] = data?.clients || [];
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

  /* ─── fetch catalogo ─── */
  const fetchCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const res = await fetch(`${BASE}/fetch-catalogo?page=1&limit=100`);
      const data = await res.json();
      setCatalogo(data?.catalogs || []);
    } catch { setCatalogo([]); }
    finally { setLoadingCatalogo(false); }
  }, []);

  useEffect(() => {
    if (showProdutoModal && catalogo.length === 0) fetchCatalogo();
  }, [showProdutoModal, catalogo.length, fetchCatalogo]);

  /* ─── cart ops ─── */
  const addToCart = (item: CatalogoItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.pro_codpro === item.pro_codpro);
      if (existing) {
        return prev.map(c => c.pro_codpro === item.pro_codpro ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { ...item, quantidade: 1, preco_unitario: 0 }];
    });
    toast({ title: 'Produto adicionado', description: item.pro_despro });
  };

  const updateQty = (codpro: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.pro_codpro !== codpro) return c;
      const newQty = Math.max(1, c.quantidade + delta);
      return { ...c, quantidade: newQty };
    }));
  };

  const removeFromCart = (codpro: number) => {
    setCart(prev => prev.filter(c => c.pro_codpro !== codpro));
  };

  const updatePrice = (codpro: number, price: number) => {
    setCart(prev => prev.map(c => c.pro_codpro === codpro ? { ...c, preco_unitario: price } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.quantidade * c.preco_unitario, 0);

  const getImageUrl = (filename: string) =>
    `${BASE}/proxy-image?file=${encodeURIComponent(filename)}`;

  const filteredCatalogo = produtoSearch.trim()
    ? catalogo.filter(c => {
        const q = produtoSearch.toLowerCase();
        return (c.pro_despro || '').toLowerCase().includes(q) || String(c.pro_codpro).includes(q);
      })
    : catalogo;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-5 space-y-6 max-w-7xl mx-auto w-full">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pedidos')}>
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Criar Pedido</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i <= step ? 'bg-erp-navy text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i === 0 && <ShoppingCart size={14} />}
                {s}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 ${i < step ? 'bg-erp-navy' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Cart */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Cliente selector */}
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <label className="text-sm font-semibold text-foreground">Cliente *</label>
                {selectedCliente ? (
                  <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                    <div>
                      <span className="font-medium text-sm">{selectedCliente.ter_codter} — {selectedCliente.ter_nomter}</span>
                      {selectedCliente.TEN_CIDLGR && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {selectedCliente.TEN_CIDLGR}{selectedCliente.TEN_UF_LGR ? ` - ${selectedCliente.TEN_UF_LGR}` : ''}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCliente(null); setClienteSearch(''); }}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={clienteSearch}
                      onChange={(e) => { setClienteSearch(e.target.value); setShowClienteDropdown(true); }}
                      onFocus={() => setShowClienteDropdown(true)}
                      placeholder="Buscar cliente por nome, código ou documento..."
                      className="pl-9"
                    />
                    {showClienteDropdown && clienteSearch.length >= 2 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingClientes ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">Buscando...</div>
                        ) : clientes.length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>
                        ) : (
                          clientes.map(c => (
                            <button
                              key={c.ter_codter}
                              className="w-full text-left px-4 py-2.5 hover:bg-accent/30 transition-colors border-b border-border last:border-0"
                              onClick={() => { setSelectedCliente(c); setShowClienteDropdown(false); setClienteSearch(''); }}
                            >
                              <div className="text-sm font-medium">{c.ter_codter} — {c.ter_nomter}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.ter_documento && `Doc: ${c.ter_documento}`}
                                {c.TEN_CIDLGR && ` · ${c.TEN_CIDLGR}`}
                                {c.TEN_UF_LGR && ` - ${c.TEN_UF_LGR}`}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-foreground">Representante</label>
                  <div className="bg-muted rounded-md px-3 py-2 text-sm text-muted-foreground mt-1">{representante}</div>
                </div>
              </div>

              {/* Products header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Produto</span>
                <span className="text-sm font-semibold text-foreground">Total</span>
              </div>

              {/* Cart items */}
              {cart.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
                  Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.pro_codpro} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                        {item.pro_foto ? (
                          <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro} className="w-full h-full object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.pro_despro}</div>
                        <div className="text-xs text-muted-foreground">Cód: {item.pro_codpro}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={item.preco_unitario || ''}
                            onChange={e => updatePrice(item.pro_codpro, parseFloat(e.target.value) || 0)}
                            className="w-24 h-7 text-xs"
                            placeholder="Preço unit."
                            step="0.01"
                          />
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 border border-border rounded-md">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQty(item.pro_codpro, -1)}>
                          <Minus size={12} />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantidade}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQty(item.pro_codpro, 1)}>
                          <Plus size={12} />
                        </Button>
                      </div>

                      {/* Total */}
                      <div className="text-sm font-semibold w-24 text-right">
                        R$ {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      {/* Remove */}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeFromCart(item.pro_codpro)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add product button */}
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowProdutoModal(true)}>
                <Plus size={16} /> Adicionar Produto
              </Button>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-erp-navy text-primary-foreground rounded-lg p-5 space-y-4 sticky top-4">
                <h3 className="font-bold text-lg">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-80">Subtotal</span>
                    <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Itens</span>
                    <span>{cart.reduce((s, c) => s + c.quantidade, 0)}</span>
                  </div>
                </div>
                <div className="border-t border-primary-foreground/20 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <Button
                  className="w-full bg-erp-amber hover:bg-erp-amber/90 text-foreground font-bold"
                  disabled={cart.length === 0 || !selectedCliente}
                  onClick={() => {
                    toast({ title: 'Pedido criado!', description: `Pedido com ${cart.length} produto(s) para ${selectedCliente?.ter_nomter}` });
                    navigate('/pedidos');
                  }}
                >
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product selection modal */}
      {showProdutoModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowProdutoModal(false)}>
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Selecionar Produto</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowProdutoModal(false)}><X size={16} /></Button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={produtoSearch}
                  onChange={e => setProdutoSearch(e.target.value)}
                  placeholder="Buscar por nome ou código..."
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loadingCatalogo ? (
                <Spinner />
              ) : filteredCatalogo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhum produto encontrado</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-foreground">CÓD</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">FOTO</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">DESCRIÇÃO</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">GRUPO</TableHead>
                      <TableHead className="text-xs font-bold text-foreground text-right">SALDO</TableHead>
                      <TableHead className="text-xs font-bold text-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCatalogo.slice(0, 50).map(item => {
                      const inCart = cart.some(c => c.pro_codpro === item.pro_codpro);
                      return (
                        <TableRow key={item.pro_codpro} className="hover:bg-accent/30">
                          <TableCell className="text-sm">{item.pro_codpro}</TableCell>
                          <TableCell>
                            {item.pro_foto ? (
                              <img src={getImageUrl(item.pro_foto)} alt={item.pro_despro}
                                className="w-10 h-10 object-contain rounded bg-muted"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{item.pro_despro}</TableCell>
                          <TableCell className="text-sm">{item.NOME_GRUPO || '—'}</TableCell>
                          <TableCell className="text-sm text-right">{parseFloat(item.SALDOS).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={inCart ? 'secondary' : 'default'}
                              className="gap-1"
                              onClick={() => addToCart(item)}
                            >
                              <Plus size={12} /> {inCart ? 'Mais 1' : 'Adicionar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriarPedido;
