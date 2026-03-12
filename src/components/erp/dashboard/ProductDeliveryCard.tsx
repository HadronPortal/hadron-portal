import { MoreHorizontal } from 'lucide-react';

interface Delivery {
  image: string;
  name: string;
  recipient: string;
  status: string;
  statusColor: string;
}

const deliveries: Delivery[] = [
  { image: '👕', name: 'Camiseta Premium', recipient: 'Carlos Silva', status: 'Entregue', statusColor: 'text-green-500' },
  { image: '📦', name: 'Kit Escritório', recipient: 'Ana Souza', status: 'Envio', statusColor: 'text-blue-500' },
  { image: '🎧', name: 'Fone Bluetooth', recipient: 'João Santos', status: 'Confirmado', statusColor: 'text-orange-500' },
  { image: '⌚', name: 'Relógio Smart', recipient: 'Maria Lima', status: 'Entregue', statusColor: 'text-green-500' },
];

const ProductDeliveryCard = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      <div className="mb-1">
        <h3 className="text-base font-semibold text-foreground">Entrega de Produtos</h3>
        <p className="text-xs text-muted-foreground">1 milhão de produtos enviados até o momento.</p>
      </div>
      <button className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 w-fit mt-3 mb-5 hover:bg-accent">
        Detalhes do pedido
      </button>

      <div className="space-y-1 flex-1">
        {deliveries.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg flex-shrink-0">
              {item.image}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                <button className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground">Para: {item.recipient}</span>
                <span className={`text-xs font-medium ${item.statusColor}`}>{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDeliveryCard;
