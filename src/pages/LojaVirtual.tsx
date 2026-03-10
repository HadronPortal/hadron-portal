import { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Heart, Eye, Search, MapPin, Phone, ChevronLeft, ChevronRight, Star, Truck, Shield, RotateCcw, Headphones, Plus, Minus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/icon_hadronweb.png';

// Product images
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

// ─── Brand Color ────────────────────────────────────────────────────────
const BRAND = 'hsl(145, 63%, 42%)';
const BRAND_LIGHT = 'hsl(145, 60%, 95%)';

// ─── Types ──────────────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  badge?: string;
};

type CartItem = Product & { qty: number };

// ─── Mock Data ──────────────────────────────────────────────────────────
const categories = [
  { name: 'Cabelos', image: imgShampoo },
  { name: 'Higiene Bucal', image: imgCremeDental },
  { name: 'Corpo & Banho', image: imgSaboneteLiquido },
  { name: 'Desodorantes', image: imgDesodorante },
  { name: 'Papel & Descartáveis', image: imgPapelHigienico },
  { name: 'Cuidados com a Pele', image: imgProtetorSolar },
  { name: 'Bebê & Infantil', image: imgLencoUmedecido },
  { name: 'Acessórios', image: imgCotonete },
];

const allProducts: Product[] = [
  { id: 1, name: 'Shampoo 400ml', price: 18.90, oldPrice: 24.50, image: imgShampoo, category: 'Cabelos' },
  { id: 2, name: 'Condicionador 400ml', price: 19.90, oldPrice: 25.00, image: imgCondicionador, category: 'Cabelos' },
  { id: 3, name: 'Sabonete Barra 90g', price: 3.50, oldPrice: 4.90, image: imgSabonete, category: 'Corpo & Banho' },
  { id: 4, name: 'Sabonete Líquido 250ml', price: 12.90, oldPrice: 16.00, image: imgSaboneteLiquido, category: 'Corpo & Banho', badge: '-20%' },
  { id: 5, name: 'Creme Dental 90g', price: 6.90, oldPrice: 8.50, image: imgCremeDental, category: 'Higiene Bucal' },
  { id: 6, name: 'Desodorante Roll-on 50ml', price: 14.90, oldPrice: 19.00, image: imgDesodorante, category: 'Desodorantes', badge: '-25%' },
  { id: 7, name: 'Papel Higiênico 12un', price: 22.90, oldPrice: 28.00, image: imgPapelHigienico, category: 'Papel & Descartáveis' },
  { id: 8, name: 'Lenço Umedecido 100un', price: 15.90, oldPrice: 19.90, image: imgLencoUmedecido, category: 'Bebê & Infantil', badge: '-20%' },
  { id: 9, name: 'Escova Dental', price: 8.90, oldPrice: 11.00, image: imgEscovaDental, category: 'Higiene Bucal' },
  { id: 10, name: 'Enxaguante Bucal 500ml', price: 16.90, oldPrice: 21.00, image: imgEnxaguante, category: 'Higiene Bucal' },
  { id: 11, name: 'Protetor Solar FPS50', price: 39.90, oldPrice: 52.00, image: imgProtetorSolar, category: 'Cuidados com a Pele', badge: '-23%' },
  { id: 12, name: 'Cotonete 150un', price: 7.50, oldPrice: 9.90, image: imgCotonete, category: 'Acessórios' },
];

const newProducts: Product[] = [
  { id: 101, name: 'Shampoo Anticaspa', price: 22.90, oldPrice: 28.00, image: imgShampoo, category: 'Cabelos' },
  { id: 102, name: 'Sabonete Antibacteriano', price: 5.90, oldPrice: 7.50, image: imgSabonete, category: 'Corpo & Banho' },
  { id: 103, name: 'Creme Dental Clareador', price: 12.90, oldPrice: 16.00, image: imgCremeDental, category: 'Higiene Bucal' },
  { id: 104, name: 'Desodorante Aerosol', price: 16.90, oldPrice: 21.00, image: imgDesodorante, category: 'Desodorantes' },
  { id: 105, name: 'Condicionador Hidratante', price: 24.90, oldPrice: 30.00, image: imgCondicionador, category: 'Cabelos' },
  { id: 106, name: 'Protetor Labial', price: 9.90, oldPrice: 13.00, image: imgProtetorSolar, category: 'Cuidados com a Pele' },
];

const productTabs = ['Todos', 'Cabelos', 'Corpo & Banho', 'Higiene Bucal', 'Desodorantes'];

// ─── Floating Cart Indicator ────────────────────────────────────────────
const FlyToCart = ({ from, onDone }: { from: { x: number; y: number }; onDone: () => void }) => {
  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: from.x,
        top: from.y,
        animation: 'flyToCart 0.6s ease-in forwards',
      }}
      onAnimationEnd={onDone}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND }}>
        <ShoppingCart size={18} color="white" />
      </div>
    </div>
  );
};

// ─── Product Card ───────────────────────────────────────────────────────
const ProductCard = ({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}) => (
  <div className="group bg-white rounded-lg border border-gray-100 p-3 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
    {product.badge && (
      <span className="absolute top-2 left-2 z-10 text-[11px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: BRAND, color: 'white' }}>
        {product.badge}
      </span>
    )}
    <div className="relative aspect-square flex items-center justify-center p-4 bg-gray-50 rounded-md mb-3">
      <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300" />
      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100">
          <Heart size={14} />
        </button>
        <button className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100">
          <Eye size={14} />
        </button>
      </div>
    </div>
    <h3 className="text-sm font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
    <div className="flex items-center gap-1 mb-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: BRAND }}>R$ {product.price.toFixed(2)}</span>
        {product.oldPrice && (
          <span className="text-xs text-gray-400 line-through">R$ {product.oldPrice.toFixed(2)}</span>
        )}
      </div>
      <button
        onClick={(e) => onAddToCart(product, e)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ backgroundColor: BRAND, color: 'white' }}
      >
        <ShoppingCart size={14} />
      </button>
    </div>
  </div>
);

// ─── Horizontal Carousel ────────────────────────────────────────────────
const Carousel = ({ children, title }: { children: React.ReactNode; title?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <div className="relative">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  );
};

// ─── Cart Sidebar ───────────────────────────────────────────────────────
const CartSidebar = ({
  open,
  cart,
  onClose,
  onUpdateQty,
  onRemove,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}) => {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-[998]" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white z-[999] shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Carrinho ({cart.reduce((s, i) => s + i.qty, 0)})</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-sm text-gray-400 text-center mt-10">Carrinho vazio</p>}
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 border-b pb-3">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-gray-50 rounded" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs" style={{ color: BRAND }}>R$ {item.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 border rounded flex items-center justify-center text-xs">
                    <Minus size={12} />
                  </button>
                  <span className="text-sm">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 border rounded flex items-center justify-center text-xs">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 self-start">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span style={{ color: BRAND }}>R$ {total.toFixed(2)}</span>
          </div>
          <button
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Floating Cart Bag (like FastKart) ──────────────────────────────────
const FloatingCartBag = ({
  cart,
  expanded,
  onToggle,
  onOpenCart,
}: {
  cart: CartItem[];
  expanded: boolean;
  onToggle: () => void;
  onOpenCart: () => void;
}) => {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const displayItems = cart.slice(0, 3);
  const extraCount = cart.length - 3;

  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[997] flex flex-col items-end gap-2">
      {/* Expanded view */}
      {expanded && cart.length > 0 && (
        <div
          className="rounded-xl p-4 shadow-2xl min-w-[180px] animate-scale-in cursor-pointer"
          style={{ backgroundColor: BRAND }}
          onClick={onOpenCart}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart size={16} />
              <span className="text-sm font-bold">{cartCount} {cartCount === 1 ? 'Item' : 'Itens'}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="text-white/80 hover:text-white"
            >
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

      {/* Bag button (always visible) */}
      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-xl shadow-lg flex items-center justify-center transition-transform hover:scale-110 relative"
        style={{ backgroundColor: BRAND }}
      >
        <ShoppingCart size={22} color="white" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center" style={{ color: BRAND }}>
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────
const LojaVirtual = () => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [flyAnim, setFlyAnim] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bagExpanded, setBagExpanded] = useState(false);
  const bagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const filteredProducts = activeTab === 'Todos' ? allProducts : allProducts.filter((p) => p.category === activeTab);

  const expandBagBriefly = useCallback(() => {
    setBagExpanded(true);
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    bagTimerRef.current = setTimeout(() => setBagExpanded(false), 3000);
  }, []);

  const addToCart = (product: Product, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFlyAnim({ x: rect.left, y: rect.top });

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });

    expandBagBriefly();
    toast({ title: `${product.name} adicionado ao carrinho!` });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Fly to cart animation ── */}
      {flyAnim && <FlyToCart from={flyAnim} onDone={() => setFlyAnim(null)} />}

      {/* ── Top Bar ── */}
      <div className="text-xs text-center py-2 px-4" style={{ backgroundColor: BRAND, color: 'white' }}>
        Frete grátis em compras acima de R$ 200,00! 🚚 Distribuidora de Higiene & Beleza
      </div>

      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Hádron" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-gray-800">
              Hádron<span style={{ color: BRAND }}>Shop</span>
            </span>
          </div>

          <div className="flex-1 max-w-xl hidden md:flex">
            <div className="flex w-full border rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm outline-none"
              />
              <button className="px-4 text-white" style={{ backgroundColor: BRAND }}>
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} />
              <span>(11) 9999-9999</span>
            </div>
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-800">
              <Heart size={20} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-scale-in"
                  style={{ backgroundColor: BRAND }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Cart Sidebar ── */}
      <CartSidebar open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onRemove={removeFromCart} />

      {/* ── Floating Cart Bag ── */}
      <FloatingCartBag
        cart={cart}
        expanded={bagExpanded}
        onToggle={() => setBagExpanded((v) => !v)}
        onOpenCart={() => { setBagExpanded(false); setCartOpen(true); }}
      />

      {/* ── Hero Banner ── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Banner */}
          <div
            className="lg:col-span-7 rounded-xl p-8 md:p-12 flex items-center min-h-[320px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(145, 30%, 96%), hsl(145, 40%, 90%))' }}
          >
            <div className="relative z-10 max-w-md">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND }}>
                HIGIENE & BELEZA
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2 leading-tight">
                Cuidado Pessoal
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-500 mt-1">Para toda a família</h2>
              <p className="text-sm text-gray-500 mt-3">
                Produtos de higiene, beleza e cuidados pessoais com os melhores preços.
              </p>
              <button
                className="mt-5 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-transform hover:scale-105"
                style={{ backgroundColor: BRAND }}
              >
                Ver Produtos
              </button>
            </div>
            <img
              src={imgHero}
              alt="Produtos de Higiene"
              className="absolute right-0 bottom-0 h-full max-h-[300px] object-contain opacity-90 hidden md:block"
            />
          </div>

          {/* Side Banners */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-4">
            <div
              className="rounded-xl p-6 flex items-center justify-center text-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, hsl(145, 60%, 35%), ${BRAND})` }}
            >
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">Marcas Premium</h3>
                <p className="text-white/80 text-sm mt-1">Qualidade garantida</p>
                <button className="mt-3 px-5 py-2 border border-white text-white rounded-lg text-sm hover:bg-white/20 transition">
                  Ver Mais
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4 bg-gray-800 text-white flex flex-col justify-center">
                <h4 className="text-sm font-bold">Kit Econômico</h4>
                <p className="text-xs text-gray-300 mt-1">Até 40% de desconto</p>
              </div>
              <div className="rounded-xl p-4 flex flex-col justify-center" style={{ backgroundColor: 'hsl(25, 90%, 92%)' }}>
                <h4 className="text-sm font-bold text-gray-800">Cuidados Bebê</h4>
                <p className="text-xs text-gray-600 mt-1">Linha completa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories Carousel ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Categorias">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex-shrink-0 w-[130px] flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-center font-medium text-gray-700">{cat.name}</span>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ── Best Value Banners ── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <Carousel title="Melhores Ofertas">
          {[
            { title: 'Kits Econômicos!', sub: 'Shampoo + Condicionador', img: imgShampoo, bg: 'hsl(220, 40%, 92%)' },
            { title: 'Promoção Bebê!', sub: 'Fraldas & Lenços', img: imgLencoUmedecido, bg: 'hsl(30, 80%, 92%)' },
            { title: 'Compre 3, Pague 2', sub: 'Sabonetes selecionados', img: imgSabonete, bg: 'hsl(200, 40%, 92%)' },
          ].map((v, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[300px] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
              style={{ backgroundColor: v.bg }}
            >
              <img src={v.img} alt={v.title} className="w-24 h-24 object-contain" />
              <div>
                <h4 className="text-sm font-bold text-gray-800">{v.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
                <button className="text-xs font-semibold mt-2 underline" style={{ color: BRAND }}>
                  Ver Oferta
                </button>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ── Products Grid with Tabs ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Nossos Produtos</h2>
          <div className="flex gap-2">
            {productTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={activeTab === tab ? { backgroundColor: BRAND } : {}}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* ── Promotional Banners ── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, hsl(220, 30%, 94%), hsl(220, 50%, 88%))' }}>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: BRAND }}>Atacado</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Produtos de Higiene por Caixa</h3>
              <p className="text-sm text-gray-500">Desconto progressivo para distribuidores</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold" style={{ backgroundColor: BRAND }}>
                Ver Ofertas
              </button>
            </div>
            <img src={imgSaboneteLiquido} alt="" className="absolute right-4 bottom-2 h-[140px] object-contain hidden sm:block" />
          </div>
          <div className="rounded-xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, hsl(25, 80%, 94%), hsl(30, 60%, 88%))' }}>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'hsl(25, 90%, 55%)' }}>Novidade</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Linha Dermatológica</h3>
              <p className="text-sm text-gray-500">Cuidados especiais para a pele</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold" style={{ backgroundColor: 'hsl(25, 90%, 55%)' }}>
                Conhecer
              </button>
            </div>
            <img src={imgProtetorSolar} alt="" className="absolute right-4 bottom-2 h-[140px] object-contain hidden sm:block" />
          </div>
        </div>
      </section>

      {/* ── New Products Carousel ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Novos Produtos">
          {newProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[200px]">
              <ProductCard product={product} onAddToCart={addToCart} />
            </div>
          ))}
        </Carousel>
      </section>

      {/* ── Features Strip ── */}
      <section className="border-t border-b py-8">
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

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="Hádron" className="w-8 h-8 object-contain" />
                <span className="text-lg font-bold text-white">HádronShop</span>
              </div>
              <p className="text-sm text-gray-400">
                Distribuidora de produtos de higiene, beleza e cuidados pessoais.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Categorias</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">Cabelos</li>
                <li className="hover:text-white cursor-pointer">Higiene Bucal</li>
                <li className="hover:text-white cursor-pointer">Corpo & Banho</li>
                <li className="hover:text-white cursor-pointer">Desodorantes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Institucional</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">Sobre Nós</li>
                <li className="hover:text-white cursor-pointer">Contato</li>
                <li className="hover:text-white cursor-pointer">Política de Privacidade</li>
                <li className="hover:text-white cursor-pointer">Termos de Uso</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contato</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>São Paulo, SP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>(11) 9999-9999</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
            © 2026 HádronShop. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes flyToCart {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(0.3) translate(calc(100vw - 200px), -50vh);
            opacity: 0;
          }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LojaVirtual;
