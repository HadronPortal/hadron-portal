import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Spinner from "@/components/ui/spinner";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErpLayout from "@/components/erp/ErpLayout";

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
const Perfil = lazy(() => import("./pages/Perfil"));
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
  <div className="flex-1 flex items-center justify-center">
    <Spinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Spinner /></div>}>
          <Routes>
            {/* ERP pages share Header via ErpLayout */}
            <Route element={<ProtectedRoute><ErpLayout /></ProtectedRoute>}>
              <Route path="/" element={<Suspense fallback={<PageFallback />}><Index /></Suspense>} />
              <Route path="/clientes" element={<Suspense fallback={<PageFallback />}><Clientes /></Suspense>} />
              <Route path="/cobrancas" element={<Suspense fallback={<PageFallback />}><Cobrancas /></Suspense>} />
              <Route path="/analitico" element={<Suspense fallback={<PageFallback />}><Analitico /></Suspense>} />
              <Route path="/pedidos" element={<Suspense fallback={<PageFallback />}><Pedidos /></Suspense>} />
              <Route path="/pedidos/criar" element={<Suspense fallback={<PageFallback />}><CriarPedido /></Suspense>} />
              <Route path="/pedidos/:id" element={<Suspense fallback={<PageFallback />}><PedidoDetalhe /></Suspense>} />
              <Route path="/produtos" element={<Suspense fallback={<PageFallback />}><Produtos /></Suspense>} />
              <Route path="/produtos/:id" element={<Suspense fallback={<PageFallback />}><ProdutoDetalhe /></Suspense>} />
              <Route path="/catalogo" element={<Suspense fallback={<PageFallback />}><Catalogo /></Suspense>} />
            </Route>

            {/* Standalone pages (own layout) */}
            <Route path="/loja" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Spinner /></div>}><LojaVirtual /></Suspense></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
