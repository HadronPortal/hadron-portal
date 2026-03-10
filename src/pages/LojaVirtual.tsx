import { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Heart, Eye, Search, MapPin, Phone, ChevronLeft, ChevronRight, Star, Truck, Shield, RotateCcw, Headphones, Plus, Minus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/icon_hadronweb.png';

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
  { name: 'Óleos & Grãos', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/1.png' },
  { name: 'Farinhas & Cereais', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/2.png' },
  { name: 'Mercearia', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/3.png' },
  { name: 'Grãos & Legumes', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/4.png' },
  { name: 'Bebidas', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/5.png' },
  { name: 'Frutas & Verduras', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/6.png' },
  { name: 'Prontos p/ Consumo', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/7.png' },
  { name: 'Misturas Instantâneas', image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/category/8.png' },
];

const allProducts: Product[] = [
  { id: 1, name: 'Pimentão', price: 12.90, oldPrice: 15.50, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/1.png', category: 'Verduras' },
  { id: 2, name: 'Berinjela', price: 8.50, oldPrice: 10.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/2.png', category: 'Verduras' },
  { id: 3, name: 'Cebola', price: 5.90, oldPrice: 7.20, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/3.png', category: 'Verduras' },
  { id: 4, name: 'Batata', price: 6.50, oldPrice: 8.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/4.png', category: 'Verduras', badge: '-20%' },
  { id: 5, name: 'Pimenta', price: 4.90, oldPrice: 6.50, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/5.png', category: 'Temperos' },
  { id: 6, name: 'Brócolis', price: 9.90, oldPrice: 12.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/6.png', category: 'Verduras', badge: '-25%' },
  { id: 7, name: 'Abacate', price: 7.90, oldPrice: 9.50, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/9.png', category: 'Frutas' },
  { id: 8, name: 'Pepino', price: 3.90, oldPrice: 5.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/11.png', category: 'Verduras', badge: '-25%' },
  { id: 9, name: 'Beterraba', price: 5.50, oldPrice: 7.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/12.png', category: 'Verduras' },
  { id: 10, name: 'Morango', price: 14.90, oldPrice: 18.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/13.png', category: 'Frutas' },
  { id: 11, name: 'Milho', price: 4.50, oldPrice: 6.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/15.png', category: 'Verduras', badge: '50%' },
  { id: 12, name: 'Repolho', price: 3.50, oldPrice: 4.90, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/cate1/17.png', category: 'Verduras' },
];

const newProducts: Product[] = [
  { id: 101, name: 'Tomate', price: 8.90, oldPrice: 11.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/1.png', category: 'Verduras' },
  { id: 102, name: 'Cebola Roxa', price: 7.50, oldPrice: 9.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/2.png', category: 'Verduras' },
  { id: 103, name: 'Cenoura', price: 5.90, oldPrice: 7.50, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/3.png', category: 'Verduras' },
  { id: 104, name: 'Batata Doce', price: 6.90, oldPrice: 8.50, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/4.png', category: 'Verduras' },
  { id: 105, name: 'Brócolis Ninja', price: 11.90, oldPrice: 14.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/5.png', category: 'Verduras' },
  { id: 106, name: 'Cenoura Baby', price: 9.90, oldPrice: 12.00, image: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/pro1/6.png', category: 'Verduras' },
];

const productTabs = ['Todos', 'Verduras', 'Frutas', 'Temperos'];

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
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}>
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
      <span className="absolute top-2 left-2 z-10 text-[11px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'hsl(160, 84%, 39%)', color: 'white' }}>
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
        <span className="text-sm font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>R$ {product.price.toFixed(2)}</span>
        {product.oldPrice && (
          <span className="text-xs text-gray-400 line-through">R$ {product.oldPrice.toFixed(2)}</span>
        )}
      </div>
      <button
        onClick={(e) => onAddToCart(product, e)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ backgroundColor: 'hsl(160, 84%, 39%)', color: 'white' }}
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
                <p className="text-xs" style={{ color: 'hsl(160, 84%, 39%)' }}>R$ {item.price.toFixed(2)}</p>
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
            <span style={{ color: 'hsl(160, 84%, 39%)' }}>R$ {total.toFixed(2)}</span>
          </div>
          <button
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────
const LojaVirtual = () => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [flyAnim, setFlyAnim] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredProducts = activeTab === 'Todos' ? allProducts : allProducts.filter((p) => p.category === activeTab);

  const addToCart = (product: Product, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFlyAnim({ x: rect.left, y: rect.top });

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });

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
      <div className="text-xs text-center py-2 px-4" style={{ backgroundColor: 'hsl(160, 84%, 39%)', color: 'white' }}>
        Frete grátis em compras acima de R$ 150,00! 🚚
      </div>

      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Hádron" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-gray-800">
              Hádron<span style={{ color: 'hsl(160, 84%, 39%)' }}>Shop</span>
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
              <button className="px-4 text-white" style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}>
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
                  style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
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

      {/* ── Hero Banner ── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Banner */}
          <div
            className="lg:col-span-7 rounded-xl p-8 md:p-12 flex items-center min-h-[320px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(160, 30%, 96%), hsl(160, 40%, 90%))' }}
          >
            <div className="relative z-10 max-w-md">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'hsl(160, 84%, 39%)' }}>
                ORGÂNICO
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2 leading-tight">
                100% Frescos
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-500 mt-1">Frutas & Verduras</h2>
              <p className="text-sm text-gray-500 mt-3">
                Frete grátis em todos os pedidos. Entregamos para você aproveitar.
              </p>
              <button
                className="mt-5 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-transform hover:scale-105"
                style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
              >
                Comprar Agora
              </button>
            </div>
            <img
              src="https://themes.pixelstrap.com/fastkart/assets/images/veg-3/home/1.png"
              alt="Hero"
              className="absolute right-0 bottom-0 h-full max-h-[300px] object-contain opacity-90 hidden md:block"
            />
          </div>

          {/* Side Banners */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-4">
            <div
              className="rounded-xl p-6 flex items-center justify-center text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsl(170, 50%, 45%), hsl(160, 84%, 39%))' }}
            >
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">Frescos & 100% Orgânicos</h3>
                <p className="text-white/80 text-sm mt-1">Direto do produtor</p>
                <button className="mt-3 px-5 py-2 border border-white text-white rounded-lg text-sm hover:bg-white/20 transition">
                  Comprar Agora
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4 bg-gray-800 text-white flex flex-col justify-center">
                <h4 className="text-sm font-bold">Vida Orgânica</h4>
                <p className="text-xs text-gray-300 mt-1">Ofertas de Fim de Semana</p>
              </div>
              <div className="rounded-xl p-4 flex flex-col justify-center" style={{ backgroundColor: 'hsl(25, 90%, 92%)' }}>
                <h4 className="text-sm font-bold text-gray-800">Comida Saudável</h4>
                <p className="text-xs text-gray-600 mt-1">Desconto Especial</p>
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
            { title: 'Economize Mais!', sub: 'Vegetais Orgânicos', img: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/value/2.png', bg: 'hsl(160, 40%, 92%)' },
            { title: 'Hot Deals!', sub: 'Frutas & Verduras', img: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/value/3.png', bg: 'hsl(30, 80%, 92%)' },
            { title: 'Compre Mais, Pague Menos', sub: 'Frutas & Verduras', img: 'https://themes.pixelstrap.com/fastkart/assets/images/veg-3/value/1.png', bg: 'hsl(200, 40%, 92%)' },
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
                <button className="text-xs font-semibold mt-2 underline" style={{ color: 'hsl(160, 84%, 39%)' }}>
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
                style={activeTab === tab ? { backgroundColor: 'hsl(160, 84%, 39%)' } : {}}
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
          <div className="rounded-xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, hsl(160, 30%, 94%), hsl(160, 50%, 88%))' }}>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'hsl(160, 84%, 39%)' }}>Premium</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">Vegetais Frescos & Consumo Diário</h3>
              <p className="text-sm text-gray-500">Ganhe 50% de desconto extra</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold" style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}>
                Comprar Agora
              </button>
            </div>
            <img src="https://themes.pixelstrap.com/fastkart/assets/images/veg-3/banner/1.png" alt="" className="absolute right-4 bottom-0 h-[160px] object-contain hidden sm:block" />
          </div>
          <div className="rounded-xl p-8 relative overflow-hidden min-h-[180px] flex items-center" style={{ background: 'linear-gradient(135deg, hsl(25, 80%, 94%), hsl(30, 60%, 88%))' }}>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'hsl(25, 90%, 55%)' }}>Disponível</span>
              <h3 className="text-lg font-bold text-gray-800 mt-1">100% Natural & Frutas Saudáveis</h3>
              <p className="text-sm text-gray-500">Especial de Fim de Semana</p>
              <button className="mt-3 px-5 py-2 text-white text-sm rounded-lg font-semibold" style={{ backgroundColor: 'hsl(25, 90%, 55%)' }}>
                Comprar Agora
              </button>
            </div>
            <img src="https://themes.pixelstrap.com/fastkart/assets/images/veg-3/banner/2.png" alt="" className="absolute right-4 bottom-0 h-[160px] object-contain hidden sm:block" />
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(160, 84%, 95%)' }}>
                <Icon size={20} style={{ color: 'hsl(160, 84%, 39%)' }} />
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
                Sua loja online de produtos frescos e de qualidade.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Categorias</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">Verduras</li>
                <li className="hover:text-white cursor-pointer">Frutas</li>
                <li className="hover:text-white cursor-pointer">Mercearia</li>
                <li className="hover:text-white cursor-pointer">Bebidas</li>
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
