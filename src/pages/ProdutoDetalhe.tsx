import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import FilterBar from '@/components/erp/FilterBar';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { ArrowLeft, Package, Scale, DollarSign, Layers, Tag, Ruler } from 'lucide-react';

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

const ProdutoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-product-details?product_id=${id}`
        );
        if (!res.ok) throw new Error('Falha ao buscar detalhes do produto');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const info = data?.info;
  const precos = data?.precos;
  const estoques = data?.estoques || [];

  return (
    <>
      <FilterBar />

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/produtos')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Voltar para Produtos
        </Button>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{error}</div>
        ) : info ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              {info.pro_foto ? (
                <img
                  src={`${PROXY_BASE}${encodeURIComponent(info.pro_foto)}`}
                  alt={info.pro_despro}
                  className="w-32 h-32 object-contain rounded-lg bg-muted border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-muted border border-border flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">{info.pro_despro}</h1>
                <p className="text-muted-foreground text-sm">
                  Código: <span className="font-mono font-medium text-foreground">{info.pro_codpro}</span>
                  {info.pro_codint && <> · Cód. Interno: <span className="font-mono font-medium text-foreground">{info.pro_codint}</span></>}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    info.pro_fl_ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {info.pro_fl_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  {info.tprc_grp?.grp_nomgrp && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">
                      {info.tprc_grp.grp_nomgrp}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Preços */}
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="w-4 h-4 text-primary" /> Preços
                </div>
                {precos && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Tabela 1</span><span className="font-medium">{formatCurrency(precos.ppr_prcpro1)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tabela 2</span><span className="font-medium">{formatCurrency(precos.ppr_prcpro2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tabela 3</span><span className="font-medium">{formatCurrency(precos.ppr_prcpro3)}</span></div>
                    <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Preço Mínimo</span><span className="font-medium">{formatCurrency(precos.ppr_prc_min)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Base Retab.</span><span className="font-medium">{formatCurrency(precos.ppr_bas_rtb)}</span></div>
                  </div>
                )}
              </div>

              {/* Estoque */}
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Layers className="w-4 h-4 text-primary" /> Estoque
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Saldo Atual</span><span className="font-medium">{info.pro_sdo_atu}</span></div>
                  {estoques.map((e, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Livre</span>
                      <span className="font-medium">{e.sdo_sdo_lvr}</span>
                    </div>
                  ))}
                  <div className="flex justify-between"><span className="text-muted-foreground">Unid. Embalagem</span><span className="font-medium">{info.pro_unid_emb}</span></div>
                </div>
              </div>

              {/* Peso e Medidas */}
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Scale className="w-4 h-4 text-primary" /> Peso e Medidas
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Peso Bruto</span><span className="font-medium">{info.pro_peso_bru} {info.pro_unidade}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Peso Líquido</span><span className="font-medium">{info.pro_peso_liq} {info.pro_unidade}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Altura</span><span className="font-medium">{info.pro_dph_altura} cm</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Largura</span><span className="font-medium">{info.pro_dph_largura} cm</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Comprimento</span><span className="font-medium">{info.pro_dph_comprim} cm</span></div>
                </div>
              </div>

              {/* Fiscal */}
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Tag className="w-4 h-4 text-primary" /> Fiscal
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">NCM</span><span className="font-mono font-medium">{info.pro_codncm}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IPI</span><span className="font-medium">{info.pro_alq_ipi}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Alíq. ONI</span><span className="font-medium">{info.pro_alq_oni}%</span></div>
                  {info.pro_gtin && <div className="flex justify-between"><span className="text-muted-foreground">GTIN</span><span className="font-mono font-medium">{info.pro_gtin}</span></div>}
                  {info.pro_marca && <div className="flex justify-between"><span className="text-muted-foreground">Marca</span><span className="font-medium">{info.pro_marca}</span></div>}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default ProdutoDetalhe;
