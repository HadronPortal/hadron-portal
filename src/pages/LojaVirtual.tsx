import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ShoppingCart, Heart, Search, MapPin, Phone,
  ChevronLeft, ChevronRight, Star, Truck, Shield,
  RotateCcw, Headphones, Plus, Minus, X, Menu,
  ArrowRight, Eye, Flame, RefreshCw, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Brand ──────────────────────────────────────────────────────────────
const B = '#0da487';
const BL = '#e8f5f1';
const IMG = 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3';

// ─── Types ──────────────────────────────────────────────────────────────
type Product = { id: number; name: string; price: number; oldPrice: number; image: string; category: string; badge?: string };
type CartItem = Product & { qty: number };

// ─── Data ───────────────────────────────────────────────────────────────
const categories = [
  { name: 'Óleos & Manteigas', img: `${IMG}/category/1.png` },
  { name: 'Arroz, Farinha & Grãos', img: `${IMG}/category/2.png` },
  { name: 'Despensa', img: `${IMG}/category/3.png` },
  { name: 'Leguminosas', img: `${IMG}/category/4.png` },
  { name: 'Bebidas', img: `${IMG}/category/5.png` },
  { name: 'Frutas & Verduras', img: `${IMG}/category/6.png` },
  { name: 'Pratos Prontos', img: `${IMG}/category/7.png` },
  { name: 'Misturas Instantâneas', img: `${IMG}/category/8.png` },
];

const valueBanners = [
  { title: 'Compre mais, Economize mais', sub: 'Frutas & Verduras', img: `${IMG}/value/1.png`, bg: '#e8f5f1' },
  { title: 'Economize Mais!', sub: 'Vegetais Orgânicos', img: `${IMG}/value/2.png`, bg: '#fff5e6' },
  { title: 'Ofertas Quentes!', sub: 'Frutas & Verduras', img: `${IMG}/value/3.png`, bg: '#f0e8ff' },
];

const dealProducts: Product[] = [
  { id: 301, name: 'Berinjela', price: 65.00, oldPrice: 70.21, image: `${IMG}/cate1/2.png`, category: 'Cozinha', badge: 'Oferta' },
  { id: 302, name: 'Cebola', price: 65.00, oldPrice: 70.21, image: `${IMG}/cate1/3.png`, category: 'Cozinha', badge: 'Oferta' },
  { id: 303, name: 'Pimentão', price: 65.00, oldPrice: 70.21, image: `${IMG}/cate1/1.png`, category: 'Cozinha', badge: 'Oferta' },
];

const allProducts: Product[] = [
  { id: 1, name: 'Pimentão', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/1.png`, category: 'Todos' },
  { id: 2, name: 'Batata', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/3.png`, category: 'Cozinha', badge: '50%' },
  { id: 3, name: 'Pimenta', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/5.png`, category: 'Cozinha' },
  { id: 4, name: 'Brócolis', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/6.png`, category: 'Frutas & Verduras', badge: '-25%' },
  { id: 5, name: 'Peru', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/7.png`, category: 'Frutas & Verduras' },
  { id: 6, name: 'Abacate', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/9.png`, category: 'Frutas & Verduras' },
  { id: 7, name: 'Pepino', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/11.png`, category: 'Frutas & Verduras', badge: '-25%' },
  { id: 8, name: 'Beterraba', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/12.png`, category: 'Cozinha' },
  { id: 9, name: 'Morango', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/13.png`, category: 'Frutas & Verduras' },
  { id: 10, name: 'Milho', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/15.png`, category: 'Cozinha', badge: '50%' },
  { id: 11, name: 'Repolho', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/17.png`, category: 'Cozinha', badge: '-25%' },
  { id: 12, name: 'Gengibre', price: 70.21, oldPrice: 65.25, image: `${IMG}/cate1/18.png`, category: 'Cozinha' },
];

const newProducts: Product[] = [
  { id: 101, name: 'Batata', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/4.png`, category: 'Cozinha' },
  { id: 102, name: 'Brócolis', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/5.png`, category: 'Frutas & Verduras' },
  { id: 103, name: 'Cenoura', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/6.png`, category: 'Frutas & Verduras' },
  { id: 104, name: 'Tomate', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/1.png`, category: 'Frutas & Verduras' },
  { id: 105, name: 'Cebola Roxa', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/2.png`, category: 'Cozinha' },
  { id: 106, name: 'Cenoura', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/3.png`, category: 'Frutas & Verduras' },
];

const featureProducts: Product[] = [
  { id: 201, name: 'Pimentão', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/10.png`, category: 'Frutas & Verduras' },
  { id: 202, name: 'Ervilha', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/11.png`, category: 'Frutas & Verduras' },
  { id: 203, name: 'Abacate', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/12.png`, category: 'Frutas & Verduras' },
  { id: 204, name: 'Alho', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/7.png`, category: 'Cozinha' },
  { id: 205, name: 'Beterraba', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/8.png`, category: 'Cozinha' },
  { id: 206, name: 'Berinjela', price: 75.20, oldPrice: 65.21, image: `${IMG}/pro1/9.png`, category: 'Cozinha' },
];

const productTabs = ['Todos', 'Cozinha', 'Frutas & Verduras', 'Bebidas', 'Laticínios'];

// ─── Helpers ────────────────────────────────────────────────────────────
const Stars = () => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
  </div>
);

// ─── Carousel ───────────────────────────────────────────────────────────
const Carousel = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 300, behavior: 'smooth' });
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400"><ChevronLeft size={16} className="text-gray-500" /></button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400"><ChevronRight size={16} className="text-gray-500" /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>{children}</div>
    </div>
  );
};

// ─── Product Card ───────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd }: { product: Product; onAdd: (p: Product, e: React.MouseEvent) => void }) => (
  <div className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all relative">
    {product.badge && (
      <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: B }}>{product.badge}</span>
    )}
    <div className="relative aspect-square flex items-center justify-center p-4 bg-[#fafafa]">
      <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
        <button className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"><Heart size={12} className="text-gray-400" /></button>
        <button className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"><Eye size={12} className="text-gray-400" /></button>
        <button className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50"><RefreshCw size={12} className="text-gray-400" /></button>
      </div>
    </div>
    <div className="p-3">
      <Stars />
      <h3 className="text-sm font-medium text-gray-700 mt-1 mb-1.5 truncate">{product.name}</h3>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold" style={{ color: B }}>${product.price.toFixed(2)}</span>
          <span className="text-xs text-gray-400 line-through ml-1">${product.oldPrice.toFixed(2)}</span>
        </div>
        <button onClick={(e) => onAdd(product, e)} className="w-7 h-7 rounded-full flex items-center justify-center text-white transition hover:scale-110" style={{ backgroundColor: B }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  </div>
);

// ─── Mini Product Card (for carousels) ──────────────────────────────────
const MiniCard = ({ product, onAdd }: { product: Product; onAdd: (p: Product, e: React.MouseEvent) => void }) => (
  <div className="flex-shrink-0 w-[180px] group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all">
    <div className="aspect-square flex items-center justify-center p-3 bg-[#fafafa]">
      <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
    </div>
    <div className="p-2.5">
      <h4 className="text-xs font-medium text-gray-700 truncate">{product.name}</h4>
      <div className="flex items-center justify-between mt-1">
        <div>
          <span className="text-xs font-bold" style={{ color: B }}>${product.price.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400 line-through ml-1">${product.oldPrice.toFixed(2)}</span>
        </div>
        <button onClick={(e) => onAdd(product, e)} className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: B }}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  </div>
);

// ─── Cart Sidebar ───────────────────────────────────────────────────────
const CartSidebar = ({ open, cart, onClose, onUpdateQty, onRemove }: {
  open: boolean; cart: CartItem[]; onClose: () => void;
  onUpdateQty: (id: number, d: number) => void; onRemove: (id: number) => void;
}) => {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-[998]" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-[340px] bg-white z-[999] shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: BL }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: B }} />
            <h3 className="font-bold text-gray-800">Carrinho ({count})</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-center text-gray-400 text-sm mt-16">Seu carrinho está vazio</p>}
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 relative group">
              <img src={item.image} alt={item.name} className="w-14 h-14 object-contain bg-white rounded p-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                <p className="text-sm font-bold" style={{ color: B }}>${item.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 rounded border flex items-center justify-center"><Minus size={10} /></button>
                  <span className="w-6 text-center text-xs">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 rounded border flex items-center justify-center"><Plus size={10} /></button>
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="flex justify-between font-bold"><span>Total</span><span style={{ color: B }}>${total.toFixed(2)}</span></div>
            <button className="w-full py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B }}>Finalizar Compra</button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Floating Bag ───────────────────────────────────────────────────────
const FloatingBag = ({ cart, expanded, onToggle, onOpen }: {
  cart: CartItem[]; expanded: boolean; onToggle: () => void; onOpen: () => void;
}) => {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (count === 0) return null;
  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[997] flex flex-col items-end gap-2">
      {expanded && (
        <div className="rounded-xl p-4 shadow-2xl min-w-[180px] cursor-pointer mr-1" style={{ backgroundColor: B }} onClick={onOpen}>
          <div className="flex items-center justify-between mb-2 text-white">
            <span className="text-sm font-bold">{count} Itens</span>
            <button onClick={e => { e.stopPropagation(); onToggle(); }} className="text-white/70 hover:text-white"><X size={14} /></button>
          </div>
          <div className="flex gap-1 mb-2">
            {cart.slice(0, 3).map(i => (
              <div key={i.id} className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/30">
                <img src={i.image} alt="" className="w-6 h-6 object-contain" />
              </div>
            ))}
            {cart.length > 3 && <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">+{cart.length - 3}</div>}
          </div>
          <div className="bg-white rounded-lg py-1.5 text-center"><span className="text-sm font-bold text-gray-800">${total.toFixed(2)}</span></div>
        </div>
      )}
      <button onClick={onToggle} className="w-14 h-14 rounded-xl shadow-lg flex items-center justify-center relative mr-1" style={{ backgroundColor: B }}>
        <ShoppingCart size={22} color="white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center" style={{ color: B }}>{count}</span>
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
const LojaVirtual = () => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bagExpanded, setBagExpanded] = useState(false);
  const bagTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const filtered = activeTab === 'Todos' ? allProducts : allProducts.filter(p => p.category === activeTab);

  const expandBag = useCallback(() => {
    setBagExpanded(true);
    if (bagTimer.current) clearTimeout(bagTimer.current);
    bagTimer.current = setTimeout(() => setBagExpanded(false), 3000);
  }, []);

  const flyToCart = useCallback((imgSrc: string, startX: number, startY: number) => {
    const cartEl = cartIconRef.current;
    if (!cartEl) return;
    const cartRect = cartEl.getBoundingClientRect();
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const flyEl = document.createElement('img');
    flyEl.src = imgSrc;
    flyEl.style.cssText = `
      position: fixed; z-index: 9999; width: 60px; height: 60px; object-fit: contain;
      left: ${startX - 30}px; top: ${startY - 30}px;
      border-radius: 50%; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      pointer-events: none; transition: all 0.7s cubic-bezier(0.2, 1, 0.3, 1);
    `;
    document.body.appendChild(flyEl);

    requestAnimationFrame(() => {
      flyEl.style.left = `${endX - 15}px`;
      flyEl.style.top = `${endY - 15}px`;
      flyEl.style.width = '30px';
      flyEl.style.height = '30px';
      flyEl.style.opacity = '0.3';
    });

    setTimeout(() => {
      flyEl.remove();
      // pulse the cart icon
      if (cartEl) {
        cartEl.style.transform = 'scale(1.3)';
        setTimeout(() => { cartEl.style.transform = 'scale(1)'; }, 200);
      }
    }, 700);
  }, []);

  const addToCart = (p: Product, e?: React.MouseEvent) => {
    if (e) {
      const btn = e.currentTarget as HTMLElement;
      const card = btn.closest('.group');
      const img = card?.querySelector('img');
      if (img) {
        const rect = img.getBoundingClientRect();
        flyToCart(p.image, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    expandBag();
    toast({ title: `${p.name} adicionado ao carrinho!` });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ═══ Top Bar ═══ */}
      <div className="text-xs text-center py-2 text-white" style={{ backgroundColor: B }}>
        Algo que você ama está em promoção! <button className="underline font-bold ml-1">Compre Agora!</button>
        <button className="absolute right-4 top-2 text-white/80 hover:text-white">Fechar ✕</button>
      </div>

      {/* ═══ Header ═══ */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top */}
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-800">Fast<span style={{ color: B }}>kart.</span></span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={16} style={{ color: B }} />
              <span>Sua Localização</span>
              <ChevronLeft size={14} className="rotate-[270deg]" />
            </div>
            <div className="flex-1 max-w-xl hidden md:flex">
              <div className="flex w-full rounded-lg overflow-hidden border-2 border-gray-200 focus-within:border-[#0da487]">
                <input type="text" placeholder="busque por produto, entregamos na sua porta..." className="flex-1 px-4 py-2.5 text-sm outline-none" />
                <button className="px-5 text-white" style={{ backgroundColor: B }}><Search size={18} /></button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="hidden lg:inline">Idioma</span>
              <span className="hidden lg:inline">Real</span>
              <button><RefreshCw size={20} /></button>
              <button><Heart size={20} /></button>
              <button ref={cartIconRef} onClick={() => setCartOpen(true)} className="relative transition-transform">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: B }}>{cartCount}</span>}
              </button>
            </div>
          </div>
          {/* Nav */}
          <div className="hidden md:flex items-center gap-1 pb-2 border-t pt-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: B }}>
              <Menu size={16} /> Todas as Categorias
            </button>
            {['Início', 'Loja', 'Produtos', 'Mega Menu', 'Blog', 'Páginas', 'Vendedor'].map(item => (
              <button key={item} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">{item}</button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Phone size={18} style={{ color: B }} />
              <span className="font-bold text-gray-700">(123) 456 7890</span>
              <button className="ml-4 flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: B }}>
                <Flame size={16} /> Ofertas Quentes
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartSidebar open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={(id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))} onRemove={id => setCart(p => p.filter(i => i.id !== id))} />
      <FloatingBag cart={cart} expanded={bagExpanded} onToggle={() => setBagExpanded(v => !v)} onOpen={() => { setBagExpanded(false); setCartOpen(true); }} />

      {/* ═══ Hero ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-2xl p-8 md:p-12 flex items-center min-h-[380px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0faf6, #e0f2eb)' }}>
            <div className="relative z-10 max-w-md">
              <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: B }}>ORGÂNICO</span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2">100% Frescos</h1>
              <h2 className="text-2xl text-gray-400 mt-1">Frutas & Verduras</h2>
              <p className="text-sm text-gray-400 mt-3">Frete grátis em todos os pedidos. Nós entregamos, você aproveita</p>
              <button className="mt-6 px-7 py-3 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition" style={{ backgroundColor: B }}>
                Comprar Agora <ArrowRight size={16} />
              </button>
            </div>
            <img src={`${IMG}/home/1.png`} alt="" className="absolute right-0 bottom-0 h-full max-h-[350px] object-contain hidden md:block" />
          </div>
          <div className="lg:col-span-5 grid grid-rows-2 gap-4">
            <div className="rounded-2xl p-7 flex items-center justify-center text-center relative overflow-hidden" style={{ backgroundColor: B }}>
              <img src={`${IMG}/home/2.png`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">Frescos & 100% Orgânicos</h3>
                <p className="text-white/70 text-sm mt-1">feira do produtor</p>
                <button className="mt-4 px-5 py-2 border-2 border-white text-white rounded-lg text-sm font-medium hover:bg-white/20 transition">Comprar Agora</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl relative overflow-hidden min-h-[140px]" style={{ background: '#2d3436' }}>
                <img src={`${IMG}/home/3.png`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="relative z-10 p-5 text-white">
                  <h4 className="text-sm font-bold">Estilo Orgânico</h4>
                  <p className="text-xs text-white/70 mt-1">Melhores Ofertas do Fim de Semana</p>
                </div>
              </div>
              <div className="rounded-2xl relative overflow-hidden min-h-[140px]" style={{ background: '#ff7675' }}>
                <img src={`${IMG}/home/4.png`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="relative z-10 p-5 text-white">
                  <h4 className="text-sm font-bold">Alimento seguro salva vidas</h4>
                  <p className="text-xs text-white/70 mt-1">Oferta com Desconto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Shop By Categories ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Compre por Categorias">
          {categories.map(cat => (
            <div key={cat.name} className="flex-shrink-0 w-[130px] flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: BL }}>
                <img src={cat.img} alt={cat.name} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] text-center font-medium text-gray-600 leading-tight">{cat.name}</span>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Best Value ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <Carousel title="Melhores Valores">
          {valueBanners.map((v, i) => (
            <div key={i} className="flex-shrink-0 w-[320px] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition" style={{ backgroundColor: v.bg }}>
              <img src={v.img} alt="" className="w-24 h-24 object-contain" />
              <div>
                <h4 className="text-sm font-bold text-gray-800">{v.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
                <button className="text-xs font-semibold mt-2 flex items-center gap-1" style={{ color: B }}>View Offer <ArrowRight size={12} /></button>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Deal Of The Day ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="Deal Of The Day">
          {dealProducts.map(p => (
            <div key={p.id} className="flex-shrink-0 w-[320px] bg-white rounded-xl border border-gray-100 p-5 flex gap-4 hover:shadow-lg transition">
              <div className="w-24 h-24 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: BL }}>
                <img src={p.image} alt="" className="w-16 h-16 object-contain" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-red-500">{p.badge}</span>
                <h4 className="text-sm font-bold text-gray-700 mt-1">{p.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold" style={{ color: B }}>${p.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">${p.oldPrice.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Sold: 30 Items</p>
                <div className="flex gap-1.5 mt-2">
                  {['14', '23', '59', '56'].map((t, i) => (
                    <div key={i} className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: B }}>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ═══ Our Products (Tabbed Grid) ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Our Products</h2>
          <div className="flex gap-1">
            {productTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === tab ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                style={activeTab === tab ? { backgroundColor: B } : {}}
              >{tab}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        </div>
      </section>

      {/* ═══ Promotional Banners ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-8 relative overflow-hidden min-h-[200px] flex items-center" style={{ background: 'linear-gradient(135deg, #f0faf6, #d4f0e4)' }}>
            <img src={`${IMG}/banner/1.png`} alt="" className="absolute right-4 bottom-0 h-[180px] object-contain hidden sm:block" />
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: B }}>Premium</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Fresh Vegetable & Daily Eating</h3>
              <p className="text-sm text-gray-500">Get Extra 50% Off</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold" style={{ backgroundColor: B }}>Shop Now</button>
            </div>
          </div>
          <div className="rounded-2xl p-8 relative overflow-hidden min-h-[200px] flex items-center" style={{ background: 'linear-gradient(135deg, #fff5e6, #ffe8c8)' }}>
            <img src={`${IMG}/banner/2.png`} alt="" className="absolute right-4 bottom-0 h-[180px] object-contain hidden sm:block" />
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider font-bold text-orange-500">available</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">100% Natural & Healthy Fruits</h3>
              <p className="text-sm text-gray-500">Weekend Special</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold bg-orange-500">Shop Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NEW PRODUCTS Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="NEW PRODUCTS">
          {newProducts.map(p => <MiniCard key={p.id} product={p} onAdd={addToCart} />)}
        </Carousel>
      </section>

      {/* ═══ FEATURE PRODUCT Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="FEATURE PRODUCT">
          {featureProducts.map(p => <MiniCard key={p.id} product={p} onAdd={addToCart} />)}
        </Carousel>
      </section>

      {/* ═══ BEST SELLER Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="BEST SELLER">
          {newProducts.map(p => <MiniCard key={`bs-${p.id}`} product={p} onAdd={addToCart} />)}
        </Carousel>
      </section>

      {/* ═══ ON SELL Carousel ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Carousel title="ON SELL">
          {featureProducts.map(p => <MiniCard key={`os-${p.id}`} product={p} onAdd={addToCart} />)}
        </Carousel>
      </section>

      {/* ═══ Full-width Banner ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl p-10 relative overflow-hidden min-h-[200px] flex items-center justify-center text-center" style={{ background: `linear-gradient(135deg, ${B}, #099575)` }}>
          <img src={`${IMG}/banner/3.png`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="relative z-10 text-white">
            <h4 className="text-sm uppercase tracking-wider">Try Our New</h4>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">100% Organic Best Quality Best Price</h2>
            <p className="text-sm text-white/70 mt-2">Best Fastkart Food Quality</p>
            <button className="mt-4 px-6 py-2.5 bg-white rounded-lg text-sm font-bold" style={{ color: B }}>Shop Now</button>
          </div>
        </div>
      </section>

      {/* ═══ Top Products Grid ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Top Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allProducts.slice(0, 12).map(p => <ProductCard key={`tp-${p.id}`} product={p} onAdd={addToCart} />)}
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="border-t border-b bg-white py-8 mt-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'Free Shipping world wide' },
            { icon: Clock, title: '24 x 7 Service', desc: 'Online Service For New Customer' },
            { icon: RotateCcw, title: 'Festival Offer', desc: 'New Online Special Festival' },
            { icon: Headphones, title: 'Online Payment', desc: 'Secure Payment' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: BL }}>
                <Icon size={20} style={{ color: B }} />
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
              <span className="text-xl font-black text-white">Fast<span style={{ color: B }}>kart.</span></span>
              <p className="text-sm text-gray-400 mt-3">We are a friendly bar serving a variety of cocktails, craft beers and pub food.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Categories</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {['Vegetables & Fruit', 'Beverages', 'Cooking', 'Snacks & Munchies'].map(c => <li key={c} className="hover:text-white cursor-pointer">{c}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Useful Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {['Home', 'Shop', 'About Us', 'Blog', 'Contact Us'].map(c => <li key={c} className="hover:text-white cursor-pointer">{c}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contact Us</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2"><MapPin size={14} style={{ color: B }} /><span>1418 Riverwood Drive, CA 96052</span></div>
                <div className="flex items-center gap-2"><Phone size={14} style={{ color: B }} /><span>(123) 456 7890</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
            ©2026 Fastkart All rights reserved
          </div>
        </div>
      </footer>

      <style>{`
        [style*="scrollbar"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LojaVirtual;
