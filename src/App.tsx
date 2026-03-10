import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Spinner from "@/components/ui/spinner";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Cobrancas = lazy(() => import("./pages/Cobrancas"));
const Analitico = lazy(() => import("./pages/Analitico"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Produtos = lazy(() => import("./pages/Produtos"));
const ProdutoDetalhe = lazy(() => import("./pages/ProdutoDetalhe"));
const Catalogo = lazy(() => import("./pages/Catalogo"));
const LojaVirtual = lazy(() => import("./pages/LojaVirtual"));
const Login = lazy(() => import("./pages/Login"));
const PedidoDetalhe = lazy(() => import("./pages/PedidoDetalhe"));
const CriarPedido = lazy(() => import("./pages/CriarPedido"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      gcTime: 10 * 60 * 1000, // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Spinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/cobrancas" element={<Cobrancas />} />
            <Route path="/analitico" element={<Analitico />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/criar" element={<CriarPedido />} />
            <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/loja" element={<LojaVirtual />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
