import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, X } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const PROXY_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/proxy-image?file=`;

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ProductDetail {
  success?: boolean;
  info: Record<string, any>;
  precos: Record<string, any>;
  estoques: Array<Record<string, any>>;
}

interface CatalogoDetalheProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
  productName?: string;
  productFoto?: string;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-b-0">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm font-medium text-foreground text-right ml-4">{value || '—'}</span>
  </div>
);

const CatalogoDetalhe = ({ open, onOpenChange, productId, productName, productFoto }: CatalogoDetalheProps) => {
  const { data, isLoading: loading, error: queryError } = useApiFetch<ProductDetail>({
    queryKey: ['product-detail', String(productId)],
    endpoint: 'fetch-product-details',
    params: { product_id: String(productId) },
    enabled: open && !!productId,
    staleTime: 5 * 60 * 1000,
  });

  const error = queryError ? (queryError as Error).message : null;
  const info = data?.info;
  const precos = data?.precos;
  const estoques = data?.estoques || [];

  const hasStock = (info?.pro_sdo_atu ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-border">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive text-sm p-6">{error}</div>
        ) : info ? (
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6 space-y-6">
              {/* Header */}
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Detalhes do Produto
                </DialogTitle>
              </DialogHeader>

              {/* Product Image */}
              <div className="relative rounded-xl border border-border bg-muted/20 flex items-center justify-center aspect-square overflow-hidden">
                {(info.pro_foto || productFoto) ? (
                  <img
                    src={`${PROXY_BASE}${encodeURIComponent(info.pro_foto || productFoto || '')}`}
                    alt={info.pro_despro || productName}
                    className="max-w-[70%] max-h-[70%] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground/40" />
                )}
              </div>

              {/* Product Name & Description */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {info.pro_despro || productName || '—'}
                </h2>
                {info.pro_deswww && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {info.pro_deswww}
                  </p>
                )}
              </div>

              {/* Key Info */}
              <div className="space-y-0">
                <InfoRow
                  label="Disponibilidade"
                  value={
                    <Badge variant={hasStock ? 'default' : 'destructive'} className={hasStock ? 'bg-green-500 hover:bg-green-600 text-white text-xs' : 'text-xs'}>
                      {hasStock ? 'Em Estoque' : 'Sem Estoque'}
                    </Badge>
                  }
                />
                <InfoRow label="Código" value={info.pro_codint || productId} />
                <InfoRow label="GTIN" value={info.pro_gtin} />
                <InfoRow label="Grupo" value={info.tprc_grp?.grp_nomgrp} />
                <InfoRow label="Marca" value={info.pro_marca} />
                <InfoRow label="NCM" value={info.pro_codncm} />
                <InfoRow label="Unidade" value={info.pro_unidade} />
                <InfoRow label="Saldo Atual" value={info.pro_sdo_atu?.toLocaleString('pt-BR') ?? 0} />
              </div>

              {/* Preços */}
              {precos && (
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground mb-2">Preços</h3>
                  <InfoRow label="Preço 1" value={formatCurrency(precos.ppr_prcpro1 ?? 0)} />
                  <InfoRow label="Preço 2" value={formatCurrency(precos.ppr_prcpro2 ?? 0)} />
                  <InfoRow label="Preço 3" value={formatCurrency(precos.ppr_prcpro3 ?? 0)} />
                  <InfoRow label="Preço Mínimo" value={formatCurrency(precos.ppr_prc_min ?? 0)} />
                </div>
              )}

              {/* Faixas de Desconto */}
              {(info.pro_fx_dsc_qtd1 > 0 || info.pro_fx_dsc_qtd2 > 0 || info.pro_fx_dsc_qtd3 > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Faixas de Desconto</h3>
                  {[1, 2, 3].map((n) => {
                    const qtd = info[`pro_fx_dsc_qtd${n}`];
                    const ptg = info[`pro_fx_dsc_ptg${n}`];
                    if (!qtd || qtd <= 0) return null;
                    return (
                      <div key={n} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 border border-border">
                        <span className="text-sm text-foreground">A partir de <strong>{qtd}</strong> un</span>
                        <span className="text-sm font-bold text-green-600">{ptg}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Logística */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground mb-2">Logística & Embalagem</h3>
                <InfoRow label="Qtd. Embalagem" value={`${info.pro_unid_emb || 0} ${info.pro_unidade || ''}`} />
                <InfoRow label="Múltiplo" value={info.pro_mult_und ?? 0} />
                <InfoRow label="Peso Líquido" value={info.pro_peso_liq ? `${info.pro_peso_liq.toLocaleString('pt-BR')} kg` : '—'} />
                <InfoRow label="Peso Bruto" value={info.pro_peso_bru ? `${info.pro_peso_bru.toLocaleString('pt-BR')} kg` : '—'} />
                <InfoRow
                  label="Dimensões"
                  value={
                    (info.pro_dph_comprim > 0 || info.pro_dph_altura > 0 || info.pro_dph_largura > 0)
                      ? `${info.pro_dph_comprim}x${info.pro_dph_altura}x${info.pro_dph_largura} cm`
                      : '—'
                  }
                />
                <InfoRow label="IPI" value={`${info.pro_alq_ipi ?? 0}%`} />
              </div>

              {/* Estoque por Depósito */}
              {estoques.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Estoque por Depósito</h3>
                  {estoques.map((est, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3 border border-border">
                      <div>
                        <span className="text-sm font-medium text-foreground">Depósito {est.sdo_codemw || idx + 1}</span>
                        {est.sdo_locest && <span className="text-xs text-muted-foreground ml-2">({est.sdo_locest})</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">{est.sdo_sdo_lvr?.toLocaleString('pt-BR') ?? 0}</span>
                        <Badge variant={est.sdo_fl_ativo ? 'default' : 'destructive'} className={est.sdo_fl_ativo ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs' : 'text-xs'}>
                          {est.sdo_fl_ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CatalogoDetalhe;
