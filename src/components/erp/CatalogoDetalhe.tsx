import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart } from 'lucide-react';
import Spinner from '@/components/ui/spinner';

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=`;

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ProductDetail {
  info: {
    pro_codpro: number;
    pro_despro: string;
    pro_codint: string;
    pro_foto: string;
    pro_unidade: string;
    pro_peso_bru: number;
    pro_peso_liq: number;
    pro_sdo_atu: number;
    pro_gtin: string;
    pro_marca: string;
    pro_fl_ativo: number;
    pro_codncm: number;
    pro_alq_ipi: number;
    pro_alq_oni: number;
    pro_unid_emb: number;
    pro_dph_altura: number;
    pro_dph_largura: number;
    pro_dph_comprim: number;
    tprc_grp?: { grp_nomgrp: string };
    [key: string]: unknown;
  };
  precos: {
    ppr_prcpro1: number;
    ppr_prcpro2: number;
    ppr_prcpro3: number;
    ppr_prc_min: number;
    ppr_bas_rtb: number;
    [key: string]: unknown;
  };
  estoques: Array<{
    sdo_sdo_lvr: number;
    sdo_locest: string;
    [key: string]: unknown;
  }>;
}

interface CatalogoDetalheProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
  productName?: string;
  productFoto?: string;
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start py-2.5">
    <span className="text-sm text-muted-foreground w-[120px] flex-shrink-0">{label}</span>
    <div className="text-sm font-medium text-foreground">{children}</div>
  </div>
);

const CatalogoDetalhe = ({ open, onOpenChange, productId, productName, productFoto }: CatalogoDetalheProps) => {
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !productId) {
      setData(null);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-product-details?product_id=${productId}`
        );
        if (!res.ok) throw new Error('Falha ao buscar detalhes');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, productId]);

  const info = data?.info;
  const precos = data?.precos;
  const saldoAtual = info?.pro_sdo_atu ?? 0;
  const isInStock = saldoAtual > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col bg-card overflow-y-auto">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <SheetTitle className="text-lg font-bold text-foreground">
            Detalhes do Produto
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive text-sm">{error}</div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Product Image */}
              <div className="relative rounded-xl border border-border overflow-hidden bg-card">
                <div className="flex items-center justify-center aspect-[4/3] p-6">
                  {(info?.pro_foto || productFoto) ? (
                    <img
                      src={`${PROXY_BASE}${encodeURIComponent(info?.pro_foto || productFoto || '')}`}
                      alt={info?.pro_despro || productName}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                {/* Brand badge bottom-right */}
                {info?.pro_marca && (
                  <div className="absolute bottom-3 right-3 bg-card border border-border rounded-lg px-3 py-1.5">
                    <span className="text-xs font-bold text-foreground">{info.pro_marca}</span>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {info?.pro_despro || productName}
              </h2>

              {/* Description */}
              {info && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Código: {info.pro_codpro}
                  {info.pro_codint && ` · Cód. Interno: ${info.pro_codint}`}
                  {info.pro_unidade && ` · Unidade: ${info.pro_unidade}`}
                  {info.pro_unid_emb > 0 && ` · Embalagem: ${info.pro_unid_emb} un`}
                </p>
              )}

              {/* Details table */}
              {info && (
                <div className="divide-y divide-border">
                  <DetailRow label="Disponibilidade">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isInStock
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {isInStock ? 'Em Estoque' : 'Sem Estoque'}
                    </span>
                  </DetailRow>

                  <DetailRow label="SKU">
                    <span className="font-mono">{info.pro_codpro}</span>
                  </DetailRow>

                  {info.tprc_grp?.grp_nomgrp && (
                    <DetailRow label="Grupo">
                      {info.tprc_grp.grp_nomgrp}
                    </DetailRow>
                  )}

                  <DetailRow label="Saldo Atual">
                    {saldoAtual.toLocaleString('pt-BR')}
                  </DetailRow>

                  {(info.pro_peso_liq > 0 || info.pro_peso_bru > 0) && (
                    <DetailRow label="Peso">
                      {info.pro_peso_liq > 0 ? `${info.pro_peso_liq} ${info.pro_unidade}` : `${info.pro_peso_bru} ${info.pro_unidade}`}
                    </DetailRow>
                  )}

                  {(info.pro_dph_altura > 0 || info.pro_dph_largura > 0 || info.pro_dph_comprim > 0) && (
                    <DetailRow label="Dimensões">
                      {info.pro_dph_altura}×{info.pro_dph_largura}×{info.pro_dph_comprim} cm
                    </DetailRow>
                  )}

                  {info.pro_codncm > 0 && (
                    <DetailRow label="NCM">
                      <span className="font-mono">{info.pro_codncm}</span>
                    </DetailRow>
                  )}

                  {info.pro_gtin && (
                    <DetailRow label="GTIN">
                      <span className="font-mono">{info.pro_gtin}</span>
                    </DetailRow>
                  )}
                </div>
              )}

              {/* Prices */}
              {precos && (
                <div className="flex items-baseline justify-end gap-2 pt-2">
                  {precos.ppr_prcpro2 > 0 && precos.ppr_prcpro2 !== precos.ppr_prcpro1 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(precos.ppr_prcpro2)}
                    </span>
                  )}
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(precos.ppr_prcpro1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky bottom button */}
        {!loading && !error && (
          <div className="flex-shrink-0 p-5 border-t border-border">
            <Button className="w-full h-11 text-sm font-semibold gap-2">
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao Carrinho
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CatalogoDetalhe;
