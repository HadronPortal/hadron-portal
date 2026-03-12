import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Package, Star, ShoppingCart, X } from 'lucide-react';
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
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-foreground">
              Detalhes do Produto
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive text-sm">{error}</div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Product Image */}
              <div className="relative bg-muted rounded-xl overflow-hidden flex items-center justify-center aspect-square">
                {(info?.pro_foto || productFoto) ? (
                  <img
                    src={`${PROXY_BASE}${encodeURIComponent(info?.pro_foto || productFoto || '')}`}
                    alt={info?.pro_despro || productName}
                    className="w-full h-full object-contain p-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {(!info?.pro_foto && !productFoto) && (
                  <Package className="w-16 h-16 text-muted-foreground" />
                )}
                {info?.pro_marca && (
                  <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border">
                    <span className="text-xs font-semibold text-foreground">{info.pro_marca}</span>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {info?.pro_despro || productName}
                </h2>
                {info && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Código: {info.pro_codpro}
                    {info.pro_codint && ` · Cód. Interno: ${info.pro_codint}`}
                    {info.pro_unidade && ` · Unidade: ${info.pro_unidade}`}
                  </p>
                )}
              </div>

              {/* Details Table */}
              {info && (
                <div className="space-y-0 divide-y divide-border">
                  {/* Disponibilidade */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">Disponibilidade</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                      isInStock
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isInStock ? 'Em Estoque' : 'Sem Estoque'}
                    </span>
                  </div>

                  {/* Saldo */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">Saldo Atual</span>
                    <span className="text-sm font-medium text-foreground">{saldoAtual.toLocaleString('pt-BR')}</span>
                  </div>

                  {/* SKU / Código */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">Código</span>
                    <span className="text-sm font-mono font-medium text-foreground">{info.pro_codpro}</span>
                  </div>

                  {/* Grupo */}
                  {info.tprc_grp?.grp_nomgrp && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Grupo</span>
                      <span className="text-sm font-medium text-foreground">{info.tprc_grp.grp_nomgrp}</span>
                    </div>
                  )}

                  {/* NCM */}
                  {info.pro_codncm > 0 && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">NCM</span>
                      <span className="text-sm font-mono font-medium text-foreground">{info.pro_codncm}</span>
                    </div>
                  )}

                  {/* GTIN */}
                  {info.pro_gtin && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">GTIN</span>
                      <span className="text-sm font-mono font-medium text-foreground">{info.pro_gtin}</span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                      info.pro_fl_ativo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {info.pro_fl_ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Peso */}
                  {(info.pro_peso_bru > 0 || info.pro_peso_liq > 0) && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Peso</span>
                      <span className="text-sm font-medium text-foreground">
                        {info.pro_peso_liq > 0 ? `${info.pro_peso_liq} ${info.pro_unidade}` : `${info.pro_peso_bru} ${info.pro_unidade}`}
                      </span>
                    </div>
                  )}

                  {/* Dimensões */}
                  {(info.pro_dph_altura > 0 || info.pro_dph_largura > 0 || info.pro_dph_comprim > 0) && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-muted-foreground">Dimensões</span>
                      <span className="text-sm font-medium text-foreground">
                        {info.pro_dph_altura}×{info.pro_dph_largura}×{info.pro_dph_comprim} cm
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Prices */}
              {precos && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tabela de Preços</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tabela 1</span>
                      <span className="text-lg font-bold text-foreground">{formatCurrency(precos.ppr_prcpro1)}</span>
                    </div>
                    {precos.ppr_prcpro2 > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tabela 2</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(precos.ppr_prcpro2)}</span>
                      </div>
                    )}
                    {precos.ppr_prcpro3 > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tabela 3</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(precos.ppr_prcpro3)}</span>
                      </div>
                    )}
                    {precos.ppr_prc_min > 0 && (
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="text-sm text-muted-foreground">Preço Mínimo</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(precos.ppr_prc_min)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CatalogoDetalhe;
