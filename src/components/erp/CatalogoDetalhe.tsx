import { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Package, Tag, FolderOpen, ShieldCheck, Layers, Coins, BarChart3, Truck, Scale, Boxes, Info } from 'lucide-react';
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
  catalogSaldos?: number;
  catalogSaldoFisico?: number;
  catalogPrevSaida?: number;
}

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0">
    <div className="flex items-center gap-2 min-w-0">
      {Icon && <Icon size={14} className="text-muted-foreground/60 shrink-0" />}
      <span className="text-xs text-muted-foreground truncate">{label}</span>
    </div>
    <span className="text-sm font-medium text-foreground text-right ml-4 shrink-0">{value || '—'}</span>
  </div>
);

const DetailSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="bg-muted/20 border border-border/60 rounded-xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/60">
      {Icon && <Icon size={16} className="text-primary" />}
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-4 space-y-1 bg-card/30">
      {children}
    </div>
  </div>
);

const CatalogoDetalhe = ({ open, onOpenChange, productId, productName, productFoto, catalogSaldos, catalogSaldoFisico, catalogPrevSaida }: CatalogoDetalheProps) => {
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
  const mso = info?.wprc_mso;

  // Prefer API detail data, fallback to catalog props
  const saldoFisico = info?.SALDOS != null ? Number(info.SALDOS) : (catalogSaldoFisico ?? null);
  const prevSaida = mso?.PREV_SAIDA != null ? Number(mso.PREV_SAIDA) : (catalogPrevSaida ?? null);
  const saldoDisponivel = info?.SALDO_DISPONIVEL != null ? Number(info.SALDO_DISPONIVEL) : (catalogSaldos ?? 0);
  const prevEntrada = mso?.PREV_ENTRADA != null ? Number(mso.PREV_ENTRADA) : null;
  const hasStock = saldoDisponivel > 0;

  useEffect(() => {
    if (!open) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[calc(100%-32px)] sm:max-w-[480px] p-0 flex flex-col bg-card overflow-hidden !inset-y-0 !right-0 !h-full sm:!inset-y-4 sm:!right-4 sm:!h-[calc(100vh-32px)] rounded-none sm:rounded-2xl border-0 sm:border sm:border-border shadow-2xl">
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">
            Detalhes do Produto
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-24 flex-1">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive text-sm px-6">{error}</div>
        ) : info ? (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Product Image */}
              <div className="relative rounded-2xl border border-border bg-muted/20 flex items-center justify-center aspect-square overflow-hidden shadow-inner">
                {(info.pro_foto || productFoto) ? (
                  <img
                    src={`${PROXY_BASE}${encodeURIComponent(info.pro_foto || productFoto || '')}`}
                    alt={info.pro_despro || productName}
                    className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Package className="w-20 h-20 text-muted-foreground/30" />
                )}
              </div>

              {/* Product Name & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-black text-foreground leading-tight">
                  {info.pro_despro || productName || '—'}
                </h2>
                {info.pro_deswww && (
                  <p className="text-sm text-muted-foreground leading-relaxed italic">{info.pro_deswww}</p>
                )}
              </div>

              {/* Identity Section */}
              <DetailSection title="Identificação" icon={Tag}>
                <InfoRow
                  label="Disponibilidade"
                  value={
                    <Badge variant={hasStock ? 'default' : 'destructive'} className={hasStock ? 'bg-green-500 hover:bg-green-600 text-white text-[10px] h-5' : 'text-[10px] h-5'}>
                      {hasStock ? 'Em Estoque' : 'Sem Estoque'}
                    </Badge>
                  }
                  icon={ShieldCheck}
                />
                <InfoRow label="Código" value={info.pro_codint || productId} icon={Info} />
                <InfoRow label="GTIN" value={info.pro_gtin} icon={Info} />
                <InfoRow label="Grupo" value={info.tprc_grp?.grp_nomgrp} icon={FolderOpen} />
                <InfoRow label="Marca" value={info.pro_marca} icon={Tag} />
                <InfoRow label="NCM" value={info.pro_codncm} icon={Info} />
                <InfoRow label="Unidade" value={info.pro_unidade} icon={Layers} />
              </DetailSection>

              {/* Saldos Section */}
              <DetailSection title="Saldos" icon={BarChart3}>
                <InfoRow label="Saldo Físico" value={saldoFisico != null ? Number(saldoFisico).toLocaleString('pt-BR') : '—'} icon={Boxes} />
                <InfoRow label="Previsão de Saída" value={prevSaida != null ? Number(prevSaida).toLocaleString('pt-BR') : '—'} icon={Truck} />
                <InfoRow label="Saldo Disponível" value={saldoDisponivel.toLocaleString('pt-BR')} icon={ShieldCheck} />
                <InfoRow label="Previsão de Entrada" value={prevEntrada != null ? Number(prevEntrada).toLocaleString('pt-BR') : '—'} icon={Truck} />
              </DetailSection>

              {/* Preços Section */}
              {precos && (
                <DetailSection title="Preços" icon={Coins}>
                  <InfoRow label="Preço 1" value={formatCurrency(precos.ppr_prcpro1 ?? 0)} />
                  <InfoRow label="Preço 2" value={formatCurrency(precos.ppr_prcpro2 ?? 0)} />
                  <InfoRow label="Preço 3" value={formatCurrency(precos.ppr_prcpro3 ?? 0)} />
                  <InfoRow label="Preço Mínimo" value={formatCurrency(precos.ppr_prc_min ?? 0)} />
                </DetailSection>
              )}

              {/* Faixas de Desconto Section */}
              {(info.pro_fx_dsc_qtd1 > 0 || info.pro_fx_dsc_qtd2 > 0 || info.pro_fx_dsc_qtd3 > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Faixas de Desconto</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[1, 2, 3].map((n) => {
                      const qtd = info[`pro_fx_dsc_qtd${n}`];
                      const ptg = info[`pro_fx_dsc_ptg${n}`];
                      if (!qtd || qtd <= 0) return null;
                      return (
                        <div key={n} className="flex items-center justify-between bg-green-500/5 rounded-xl px-4 py-3 border border-green-500/20 shadow-sm">
                          <span className="text-sm text-foreground">A partir de <strong className="text-green-600">{qtd}</strong> un</span>
                          <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold">{ptg}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Logística Section */}
              <DetailSection title="Logística & Embalagem" icon={Truck}>
                <InfoRow label="Qtd. Embalagem" value={`${info.pro_unid_emb || 0} ${info.pro_unidade || ''}`} icon={Package} />
                <InfoRow label="Múltiplo" value={info.pro_mult_und ?? 0} icon={Layers} />
                <InfoRow label="Peso Líquido" value={info.pro_peso_liq ? `${info.pro_peso_liq.toLocaleString('pt-BR')} kg` : '—'} icon={Scale} />
                <InfoRow label="Peso Bruto" value={info.pro_peso_bru ? `${info.pro_peso_bru.toLocaleString('pt-BR')} kg` : '—'} icon={Scale} />
                <InfoRow
                  label="Dimensões"
                  icon={Info}
                  value={
                    (info.pro_dph_comprim > 0 || info.pro_dph_altura > 0 || info.pro_dph_largura > 0)
                      ? `${info.pro_dph_comprim}x${info.pro_dph_altura}x${info.pro_dph_largura} cm`
                      : '—'
                  }
                />
                <InfoRow label="IPI" value={`${info.pro_alq_ipi ?? 0}%`} icon={Coins} />
              </DetailSection>

              {/* Estoque por Depósito Section */}
              {estoques.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Boxes size={16} className="text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Estoque por Depósito</h3>
                  </div>
                  <div className="space-y-2">
                    {estoques.map((est, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/20 rounded-xl px-4 py-3 border border-border/60 shadow-sm transition-all hover:bg-muted/30">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">Depósito {est.sdo_codemw || idx + 1}</span>
                          {est.sdo_locest && <span className="text-[10px] text-muted-foreground uppercase font-medium">{est.sdo_locest}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-black text-foreground">{est.sdo_sdo_lvr?.toLocaleString('pt-BR') ?? 0}</span>
                          <div className={`w-2.5 h-2.5 rounded-full ${est.sdo_fl_ativo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default CatalogoDetalhe;
