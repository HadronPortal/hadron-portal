import { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, X } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { useApiFetch } from '@/hooks/use-api-fetch';

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

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-0.5">
    <span className="text-xs text-muted-foreground">{label}:</span>
    <p className="text-sm font-medium text-foreground">{value || '—'}</p>
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

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [open]);

  const info = data?.info;
  const precos = data?.precos;
  const estoques = data?.estoques || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col bg-card overflow-y-auto !inset-y-0 !right-0 !h-full sm:!inset-y-auto sm:!top-5 sm:!bottom-5 sm:!right-5 sm:!h-[calc(100vh-40px)] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Produto #{productId}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {info?.pro_despro || productName || '—'}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive text-sm">{error}</div>
          ) : info ? (
            <Tabs defaultValue="info" className="flex flex-col h-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-5 h-auto py-0 gap-0">
                {['info', 'estoque', 'precos', 'vendas'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-primary"
                  >
                    {tab === 'info' ? 'Informações' : tab === 'estoque' ? 'Estoque' : tab === 'precos' ? 'Preços' : 'Vendas'}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab: Informações */}
              <TabsContent value="info" className="p-5 space-y-6 mt-0">
                {/* Image + basic info */}
                <div className="flex gap-5 items-start">
                  <div className="w-24 h-24 rounded-lg border border-border bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(info.pro_foto || productFoto) ? (
                      <img
                        src={`${PROXY_BASE}${encodeURIComponent(info.pro_foto || productFoto || '')}`}
                        alt={info.pro_despro || productName}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <Field label="Descrição" value={info.pro_despro} />
                    <Field label="Código Interno" value={info.pro_codint} />
                    <Field label="GTIN (Cód.Barras)" value={info.pro_gtin} />
                    <Field label="Grupo" value={info.tprc_grp?.grp_nomgrp} />
                    <Field label="Marca" value={info.pro_marca} />
                    <Field label="NCM" value={info.pro_codncm} />
                  </div>
                </div>

                {/* Logística & Embalagem */}
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3">Logística & Embalagem</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <Field label="Quantidade Embalagem" value={`${info.pro_unid_emb || 0} ${info.pro_unidade || ''}`} />
                    <Field label="Múltiplo Unidade" value={info.pro_mult_und ?? 0} />
                    <Field label="Conversão" value={info.pro_conv_und ?? 0} />
                    <Field label="Peso Líquido" value={info.pro_peso_liq ? `${info.pro_peso_liq.toLocaleString('pt-BR')} kg` : '—'} />
                    <Field label="Peso Bruto" value={info.pro_peso_bru ? `${info.pro_peso_bru.toLocaleString('pt-BR')} kg` : '—'} />
                    <Field
                      label="Dimensões CxAxL"
                      value={
                        (info.pro_dph_comprim > 0 || info.pro_dph_altura > 0 || info.pro_dph_largura > 0)
                          ? `${info.pro_dph_comprim}x${info.pro_dph_altura}x${info.pro_dph_largura} cm`
                          : '—'
                      }
                    />
                  </div>
                </div>

                {/* Status flags */}
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3">Status</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <Field label="Ativo" value={info.pro_fl_ativo ? 'Sim' : 'Não'} />
                    <Field label="Saldo Atual" value={info.pro_sdo_atu?.toLocaleString('pt-BR') ?? 0} />
                    <Field label="Unidade" value={info.pro_unidade} />
                    <Field label="IPI" value={`${info.pro_alq_ipi ?? 0}%`} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Estoque */}
              <TabsContent value="estoque" className="p-5 mt-0">
                {estoques.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum registro de estoque.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                      <Field label="Saldo Total" value={info.pro_sdo_atu?.toLocaleString('pt-BR') ?? 0} />
                      <Field label="Qtd. Máxima" value={info.pro_qtd_max?.toLocaleString('pt-BR') ?? 0} />
                    </div>
                    {estoques.map((est, idx) => (
                      <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            Depósito {est.sdo_codemw || idx + 1}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${est.sdo_fl_ativo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                            {est.sdo_fl_ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Saldo Livre" value={est.sdo_sdo_lvr?.toLocaleString('pt-BR') ?? 0} />
                          <Field label="Local" value={est.sdo_locest || '—'} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Preços */}
              <TabsContent value="precos" className="p-5 mt-0">
                {!precos ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum preço cadastrado.</p>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-3">Tabela de Preços</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <Field label="Preço 1" value={formatCurrency(precos.ppr_prcpro1 ?? 0)} />
                        <Field label="Preço 2" value={formatCurrency(precos.ppr_prcpro2 ?? 0)} />
                        <Field label="Preço 3" value={formatCurrency(precos.ppr_prcpro3 ?? 0)} />
                        <Field label="Preço Mínimo" value={formatCurrency(precos.ppr_prc_min ?? 0)} />
                        <Field label="Base Retábula" value={formatCurrency(precos.ppr_bas_rtb ?? 0)} />
                      </div>
                    </div>

                    {/* Faixas de desconto */}
                    {(info.pro_fx_dsc_qtd1 > 0 || info.pro_fx_dsc_qtd2 > 0 || info.pro_fx_dsc_qtd3 > 0) && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">Faixas de Desconto</h3>
                        <div className="space-y-2">
                          {[1, 2, 3].map((n) => {
                            const qtd = info[`pro_fx_dsc_qtd${n}`];
                            const ptg = info[`pro_fx_dsc_ptg${n}`];
                            if (!qtd || qtd <= 0) return null;
                            return (
                              <div key={n} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 border border-border">
                                <span className="text-sm text-foreground">A partir de <strong>{qtd}</strong> un</span>
                                <span className="text-sm font-bold text-green-600">{ptg}% de desconto</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Vendas (placeholder) */}
              <TabsContent value="vendas" className="p-5 mt-0">
                <p className="text-sm text-muted-foreground text-center py-10">
                  Em breve — histórico de vendas deste produto.
                </p>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CatalogoDetalhe;
