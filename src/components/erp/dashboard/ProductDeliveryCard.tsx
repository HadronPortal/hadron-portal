import { Package } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Produto {
  codigo: number;
  descricao: string;
  quantidade: number;
  valorTotal: number;
  foto?: string;
}

interface Props {
  produtos: Produto[];
}

const getProxyUrl = (foto: string) => {
  if (!foto) return '';
  const filename = foto.split('/').pop() || foto;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'okertqaojhjafezdwnaa';
  return `https://${projectId}.supabase.co/functions/v1/proxy-image?file=${encodeURIComponent(filename)}`;
};

const ProductImage = ({ foto, descricao }: { foto: string; descricao: string }) => {
  const [error, setError] = useState(false);
  const url = getProxyUrl(foto);

  if (!url || error) {
    return (
      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <Package size={18} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={descricao}
      onError={() => setError(true)}
      className="w-10 h-10 rounded-full object-cover bg-accent flex-shrink-0"
    />
  );
};

const ProductDeliveryCard = ({ produtos }: Props) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-foreground">Top Produtos</h3>
        <p className="text-xs text-muted-foreground">Produtos mais vendidos no período</p>
      </div>

      <div className="space-y-1 flex-1 mt-4">
        {produtos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de produtos</p>
        ) : (
          produtos.map((item) => (
            <div key={item.codigo} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30">
              <ProductImage foto={item.foto || ''} descricao={item.descricao} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{item.descricao}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Qtd: {item.quantidade.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductDeliveryCard;
