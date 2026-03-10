
-- Tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  cliente_codigo INTEGER NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_documento TEXT,
  cliente_cidade TEXT,
  cliente_uf TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  frete NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'EN',
  representante TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_codigo INTEGER NOT NULL,
  produto_nome TEXT NOT NULL,
  produto_foto TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Disable RLS since this is a public-facing ERP without user auth
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth required)
CREATE POLICY "Allow all on pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pedido_itens" ON public.pedido_itens FOR ALL USING (true) WITH CHECK (true);
