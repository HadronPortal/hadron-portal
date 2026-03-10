import { useState, useRef, useCallback } from 'react';
import {
  ShoppingCart, Heart, Eye, Search, MapPin, Phone,
  ChevronLeft, ChevronRight, Star, Truck, Shield,
  RotateCcw, Headphones, Plus, Minus, X, Menu, Flame,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/icon_hadronweb.png';

import imgHero from '@/assets/shop/hero-hygiene.jpg';
import imgShampoo from '@/assets/shop/shampoo.png';
import imgSabonete from '@/assets/shop/sabonete.png';
import imgCremeDental from '@/assets/shop/creme-dental.png';
import imgSaboneteLiquido from '@/assets/shop/sabonete-liquido.png';
import imgPapelHigienico from '@/assets/shop/papel-higienico.png';
import imgCondicionador from '@/assets/shop/condicionador.png';
import imgDesodorante from '@/assets/shop/desodorante.png';
import imgLencoUmedecido from '@/assets/shop/lenco-umedecido.png';
import imgEscovaDental from '@/assets/shop/escova-dental.png';
import imgEnxaguante from '@/assets/shop/enxaguante.png';
import imgProtetorSolar from '@/assets/shop/protetor-solar.png';
import imgCotonete from '@/assets/shop/cotonete.png';

// ─── Brand Colors (FastKart-style teal/green) ───────────────────────────
const BRAND = '#0da487';
const BRAND_LIGHT = '#e8f5f1';
const BRAND_DARK = '#099575';

// ─── Types ──────────────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  badge?: string;
  rating?: number;
};

type CartItem = Product & { qty: number };

// ─── Data ───────────────────────────────────────────────────────────────
const categories = [
  { name: 'Cabelos', image: imgShampoo },
  { name: 'Higiene Bucal', image: imgCremeDental },
  { name: 'Corpo & Banho', image: imgSaboneteLiquido },
  { name: 'Desodorantes', image: imgDesodorante },
  { name: 'Papel & Descartáveis', image: imgPapelHigienico },
  { name: 'Cuidados com Pele', image: imgProtetorSolar },
  { name: 'Bebê & Infantil', image: imgLencoUmedecido },
  { name: 'Acessórios', image: imgCotonete },
];

const allProducts: Product[] = [
  { id: 1, name: 'Shampoo Anticaspa 400ml', price: 18.90, oldPrice: 24.50, image: imgShampoo, category: 'Cabelos', rating: 4.5 },
  { id: 2, name: 'Condicionador Hidratante 400ml', price: 19.90, oldPrice: 25.00, image: imgCondicionador, category: 'Cabelos', rating: 4.3 },
  { id: 3, name: 'Sabonete em Barra 90g', price: 3.50, oldPrice: 4.90, image: imgSabonete, category: 'Corpo & Banho', rating: 4.0 },
  { id: 4, name: 'Sabonete Líquido 250ml', price: 12.90, oldPrice: 16.00, image: imgSaboneteLiquido, category: 'Corpo & Banho', badge: '-20%', rating: 4.7 },
  { id: 5, name: 'Creme Dental 90g', price: 6.90, oldPrice: 8.50, image: imgCremeDental, category: 'Higiene Bucal', rating: 4.2 },
  { id: 6, name: 'Desodorante Roll-on 50ml', price: 14.90, oldPrice: 19.00, image: imgDesodorante, category: 'Desodorantes', badge: '-25%', rating: 4.8 },
  { id: 7, name: 'Papel Higiênico 12un', price: 22.90, oldPrice: 28.00, image: imgPapelHigienico, category: 'Papel & Descartáveis', rating: 4.1 },
  { id: 8, name: 'Lenço Umedecido 100un', price: 15.90, oldPrice: 19.90, image: imgLencoUmedecido, category: 'Bebê & Infantil', badge: '-20%', rating: 4.6 },
  { id: 9, name: 'Escova Dental Macia', price: 8.90, oldPrice: 11.00, image: imgEscovaDental, category: 'Higiene Bucal', rating: 4.4 },
  { id: 10, name: 'Enxaguante Bucal 500ml', price: 16.90, oldPrice: 21.00, image: imgEnxaguante, category: 'Higiene Bucal', rating: 4.5 },
  { id: 11, name: 'Protetor Solar FPS50', price: 39.90, oldPrice: 52.00, image: imgProtetorSolar, category: 'Cuidados com Pele', badge: '-23%', rating: 4.9 },
  { id: 12, name: 'Cotonete 150un', price: 7.50, oldPrice: 9.90, image: imgCotonete, category: 'Acessórios', rating: 4.0 },
];

const dealProducts: Product[] = [
  { id: 201, name: 'Kit Shampoo + Condicionador', price: 34.90, oldPrice: 49.50, image: imgShampoo, category: 'Cabelos', badge: 'Hot', rating: 4.8 },
  { id: 202, name: 'Kit Sabonete Líquido 3un', price: 29.90, oldPrice: 42.00, image: imgSaboneteLiquido, category: 'Corpo & Banho', badge: 'Hot', rating: 4.6 },
  { id: 203, name: 'Kit Higiene Bucal Completo', price: 28.90, oldPrice: 38.00, image: imgCremeDental, category: 'Higiene Bucal', badge: 'Hot', rating: 4.7 },
];

const valueBanners = [
  { title: 'Economize Mais!', sub: 'Kits Econômicos', img: imgShampoo, bg: 'linear-gradient(135deg, #e8f5f1 0%, #d4ede5 100%)' },
  { title: 'Promoção Bebê!', sub: 'Fraldas & Lenços', img: imgLencoUmedecido, bg: 'linear-gradient(135deg, #fff5e6 0%, #ffe8c8 100%)' },
  { title: 'Compre 3, Pague 2', sub: 'Sabonetes', img: imgSabonete, bg: 'linear-gradient(135deg, #e8f0ff 0%, #d4e5ff 100%)' },
];

const productTabs = ['Todos', 'Cabelos', 'Corpo & Banho', 'Higiene Bucal', 'Desodorantes'];

// ─── Stars Component ────────────────────────────────────────────────────
const Stars = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={11}
        className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
      />
    ))}
  </div>
);

// ─── Carousel ───────────────────────────────────────────────────────────
const Carousel = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
};

// ─── Product Card (FastKart style) ──────────────────────────────────────
const ProductCard = ({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product, e: React.MouseEvent) => void;
}) => (
  <div className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 relative">
    {product.badge && (
      <span
        className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-md text-white"
        style={{ backgroundColor: product.badge === 'Hot' ? '#ff4444' : BRAND }}
      >
        {product.badge}
      </span>
    )}

    {/* Image */}
    <div className="relative aspect-square flex items-center justify-center p-5 bg-gray-50/50">
      <img
        src={product.image}
        alt={product.name}
        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
      />
      {/* Quick actions overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition">
          <Heart size={14} className="text-gray-500" />
        </button>
        <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition">
          <Eye size={14} className="text-gray-500" />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-3.5">
      <Stars rating={product.rating} />
      <h3 className="text-sm font-medium text-gray-700 mt-1.5 mb-2 leading-snug line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </h3>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[15px] font-bold" style={{ color: BRAND }}>
            R$ {product.price.toFixed(2)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through ml-1.5">
              R$ {product.oldPrice.toFixed(2)}
            </span>
          )}
        </div>
        <button
          onClick={(e) => onAdd(product, e)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: BRAND }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  </div>
);

// ─── Cart Sidebar ───────────────────────────────────────────────────────
const CartSidebar = ({
  open, cart, onClose, onUpdateQty, onRemove,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}) => {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-[998] backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-[340px] bg-white z-[999] shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: BRAND_LIGHT }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: BRAND }} />
            <h3 className="font-bold text-gray-800">Carrinho ({count})</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="text-center mt-16">
              <ShoppingCart size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Seu carrinho está vazio</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 relative group">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded bg-white p-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: BRAND }}>R$ {item.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-800">R$ {total.toFixed(2)}</span>
            </div>
            {total < 200 && (
              <div className="text-xs text-gray-500 bg-amber-50 rounded-lg p-2.5 text-center">
                🚚 Faltam <b className="text-gray-700">R$ {(200 - total).toFixed(2)}</b> para frete grátis!
              </div>
            )}
            <button
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: BRAND }}
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Floating Cart Bag (FastKart style) ─────────────────────────────────
const FloatingCartBag = ({
  cart, expanded, onToggle, onOpenCart,
}: {
  cart: CartItem[];
  expanded: boolean;
  onToggle: () => void;
  onOpenCart: () => void;
}) => {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const displayItems = cart.slice(0, 3);
  const extraCount = cart.length - 3;

  if (count === 0) return null;

  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[997] flex flex-col items-end gap-2">
      {expanded && (
        <div
          className="rounded-xl p-4 shadow-2xl min-w-[190px] cursor-pointer mr-1"
          style={{ backgroundColor: BRAND }}
          onClick={onOpenCart}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart size={16} />
              <span className="text-sm font-bold">{count} {count === 1 ? 'Item' : 'Itens'}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="text-white/70 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1 mb-3">
            {displayItems.map((item) => (
              <div key={item.id} className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/30">
                <img src={item.image} alt={item.name} className="w-7 h-7 object-contain" />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold border-2 border-white/30">
                +{extraCount}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg py-2 px-3 text-center">
            <span className="text-sm font-bold text-gray-800">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-xl shadow-lg flex items-center justify-center transition-transform hover:scale-110 relative mr-1"
        style={{ backgroundColor: BRAND }}
      >
        <ShoppingCart size={22} color="white" />
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center"
          style={{ color: BRAND }}
        >
          {count}
        </span>
      </button>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────
const LojaVirtual = () => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bagExpanded, setBagExpanded] = useState(false);
  const bagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const filteredProducts = activeTab === 'Todos'
    ? allProducts
    : allProducts.filter((p) => p.category === activeTab);

  const expandBagBriefly = useCallback(() => {
    setBagExpanded(true);
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    bagTimerRef.current = setTimeout(() => setBagExpanded(false), 3000);
  }, []);

  const addToCart = (product: Product, e: React.MouseEvent) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
    expandBagBriefly();
    toast({ title: `${product.name} adicionado!` });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ═══ Top Announcement Bar ═══ */}
      <div className="text-xs text-center py-2.5 px-4 text-white" style={{ backgroundColor: BRAND }}>
        🚚 Frete grátis em compras acima de R$ 200,00 · Distribuidora de Higiene & Beleza
        <button className="ml-4 underline hover:no-underline">Comprar Agora!</button>
      </div>

      {/* ═══ Header ═══ */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Hádron" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-gray-800">
                Hádron<span style={{ color: BRAND }}>Shop</span>
              </span>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl hidden md:flex">
              <div className="flex w-full rounded-lg overflow-hidden border-2 transition-colors focus-within:border-[#0da487]" style={{ borderColor: '#e5e7eb' }}>
                <input
                  type="text"
                  placeholder="Buscar produtos de higiene, beleza..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
                />
                <button className="px-5 text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BRAND }}>
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-5">
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
                <Phone size={16} style={{ color: BRAND }} />
                <div>
                  <div className="text-[10px] text-gray-400 leading-tight">Ligue agora</div>
                  <div className="font-semibold text-gray-700">(11) 9999-9999</div>
                </div>
              </div>
              <button className="relative text-gray-500 hover:text-gray-700">
                <Heart size={22} />
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-gray-500 hover:text-gray-700"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: BRAND }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation row */}
          <div className="hidden md:flex items-center gap-1 pb-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: BRAND }}
            >
              <Menu size={16} />
              Categorias
            </button>
            {['Início', 'Produtos', 'Ofertas', 'Kits', 'Atacado'].map((item) => (
              <button key={item} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                {item}
              </button>
            ))}
            <div className="ml-auto">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition">
                <Flame size={16} />
                Promoções
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart */}
      <CartSidebar open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onRemove={removeFromCart} />
      <FloatingCartBag
        cart={cart}
        expanded={bagExpanded}
        onToggle={() => setBagExpanded((v) => !v)}
        onOpenCart={() => { setBagExpanded(false); setCartOpen(true); }}
      />

      {/* ═══ Hero Banner (FastKart grid layout) ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main hero */}
          <div className="lg:col-span-7 rounded-2xl p-8 md:p-12 flex items-center min-h-[340px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0faf6 0%, #d4f0e4 100%)' }}>
            <div className="relative z-10 max-w-md">
              <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: BRAND }}>
                HIGIENE & BELEZA
              </span>
              <h1 className="text-3xl md:text-[40px] font-bold text-gray-800 mt-2 leading-tight">
                Cuidado Pessoal
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-400 mt-1 font-light">Para toda a família</h2>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                Produtos de higiene e cuidados pessoais com os melhores preços do mercado.
              </p>
              <button
                className="mt-6 px-7 py-3 rounded-lg text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                style={{ backgroundColor: BRAND }}
              >
                Comprar Agora
              </button>
            </div>
            <img
              src={imgHero}
              alt="Produtos"
              className="absolute right-0 bottom-0 h-full max-h-[320px] object-contain opacity-80 hidden md:block"
            />
          </div>

          {/* Side banners */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-4">
            <div
              className="rounded-2xl p-7 flex items-center justify-center text-center relative overflow-hidden"
              style={{ backgroundColor: BRAND }}
            >
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">Marcas Premium</h3>
                <p className="text-white/70 text-sm mt-1">Qualidade garantida para você</p>
                <button className="mt-4 px-5 py-2 border-2 border-white text-white rounded-lg text-sm font-medium hover:bg-white/20 transition">
                  Ver Mais
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 bg-gray-800 text-white flex flex-col justify-center">
                <h4 className="text-sm font-bold">Kit Econômico</h4>
                <p className="text-xs text-gray-400 mt-1">Até 40% de desconto</p>
                <button className="mt-3 text-xs font-semibold underline hover:no-underline" style={{ color: '#6ee7b7' }}>
                  Ver Oferta →
                </button>
              </div>
              <div className="rounded-2xl p-5 flex flex-col justify-center" style={{ backgroundColor: '#fff5e6' }}>
                <h4 className="text-sm font-bold text-gray-800">Cuidados Bebê</h4>
                <p className="text-xs text-gray-500 mt-1">Linha completa</p>
                <button className="mt-3 text-xs font-semibold text-orange-500 underline hover:no-underline">
                  Ver Linha →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Categories Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Comprar por Categoria">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex-shrink-0 w-[140px] flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: BRAND_LIGHT }}>
                <img src={cat.image} alt={cat.name} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-xs text-center font-medium text-gray-600">{cat.name}</span>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Best Value Banners ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <Carousel title="Melhores Ofertas">
          {valueBanners.map((v, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[320px] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
              style={{ background: v.bg }}
            >
              <img src={v.img} alt={v.title} className="w-24 h-24 object-contain" />
              <div>
                <h4 className="text-sm font-bold text-gray-800">{v.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
                <button className="text-xs font-semibold mt-2" style={{ color: BRAND }}>
                  Ver Oferta →
                </button>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Deal of the Day ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Oferta do Dia">
          {dealProducts.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-[300px] bg-white rounded-xl border border-gray-100 p-4 flex gap-4 hover:shadow-lg transition-all">
              <div className="w-24 h-24 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND_LIGHT }}>
                <img src={p.image} alt={p.name} className="w-16 h-16 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-red-500">
                  {p.badge}
                </span>
                <h4 className="text-sm font-semibold text-gray-700 mt-1.5 truncate">{p.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold" style={{ color: BRAND }}>R$ {p.price.toFixed(2)}</span>
                  {p.oldPrice && <span className="text-xs text-gray-400 line-through">R$ {p.oldPrice.toFixed(2)}</span>}
                </div>
                <button
                  onClick={(e) => addToCart(p, e)}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-md text-white transition hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Products Grid (Tabbed like FastKart) ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Nossos Produtos</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {productTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
      </section>

      {/* ═══ Promotional Banners ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, #f0faf6 0%, #d4f0e4 100%)' }}>
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: BRAND }}>Atacado</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Produtos por Caixa</h3>
              <p className="text-sm text-gray-500">Desconto progressivo para distribuidores</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold transition hover:opacity-90" style={{ backgroundColor: BRAND }}>
                Ver Ofertas
              </button>
            </div>
            <img src={imgSaboneteLiquido} alt="" className="absolute right-4 bottom-2 h-[140px] object-contain hidden sm:block opacity-80" />
          </div>
          <div className="rounded-2xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8c8 100%)' }}>
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider font-bold text-orange-500">Novidade</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Linha Dermatológica</h3>
              <p className="text-sm text-gray-500">Cuidados especiais para a pele</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold bg-orange-500 transition hover:opacity-90">
                Conhecer
              </button>
            </div>
            <img src={imgProtetorSolar} alt="" className="absolute right-4 bottom-2 h-[140px] object-contain hidden sm:block opacity-80" />
          </div>
        </div>
      </section>

      {/* ═══ Features Strip ═══ */}
      <section className="border-t border-b bg-white py-8 mt-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Entrega Rápida', desc: 'Em até 24 horas' },
            { icon: Shield, title: 'Pagamento Seguro', desc: '100% protegido' },
            { icon: RotateCcw, title: 'Devoluções Fáceis', desc: 'Em até 7 dias' },
            { icon: Headphones, title: 'Suporte 24/7', desc: 'Atendimento dedicado' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_LIGHT }}>
                <Icon size={20} style={{ color: BRAND }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">{title}</h4>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="Hádron" className="w-8 h-8 object-contain" />
                <span className="text-lg font-bold text-white">HádronShop</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Distribuidora de produtos de higiene, beleza e cuidados pessoais.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Categorias</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                {['Cabelos', 'Higiene Bucal', 'Corpo & Banho', 'Desodorantes'].map((c) => (
                  <li key={c} className="hover:text-white cursor-pointer transition">{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Institucional</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                {['Sobre Nós', 'Contato', 'Política de Privacidade', 'Termos de Uso'].map((c) => (
                  <li key={c} className="hover:text-white cursor-pointer transition">{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Contato</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: BRAND }} />
                  <span>São Paulo, SP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: BRAND }} />
                  <span>(11) 9999-9999</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center text-xs text-gray-500">
            © 2026 HádronShop · Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LojaVirtual;
