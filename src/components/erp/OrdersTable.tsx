import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface Order {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_cnpj: string;
  localizacao: string;
  status: 'enviado' | 'aprovado' | 'confirmado' | 'pendente' | 'cancelado';
  valor: number;
  data_pedido: string;
  erp_code?: string;
}

const statusConfig: Record<Order['status'], { label: string; color: string }> = {
  enviado: { label: 'Enviado', color: '#06b6d4' },
  aprovado: { label: 'Aprovado', color: '#f59e0b' },
  confirmado: { label: 'Confirmado', color: '#10b981' },
  pendente: { label: 'Pendente', color: '#8b8b8b' },
  cancelado: { label: 'Cancelado', color: '#ef4444' },
};

const mockOrders: Order[] = [
  { id: '1', codigo: '501', cliente_nome: 'DISTRIBUIDORA ALFA LTDA', cliente_cnpj: '12.345.678/0001-90', localizacao: 'SÃO PAULO - SP', status: 'aprovado', valor: 3450.00, data_pedido: '12/03/2026, 09:15' },
  { id: '2', codigo: '502', cliente_nome: 'COMERCIAL BETA S.A.', cliente_cnpj: '98.765.432/0001-10', localizacao: 'CAMPINAS - SP', status: 'enviado', valor: 1280.50, data_pedido: '11/03/2026, 14:30' },
];

const OrdersTable = ({ orders: propOrders }: { orders: Order[] }) => {
  const navigate = useNavigate();
  const orders = propOrders.length > 0 ? propOrders : mockOrders;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-base font-semibold text-foreground">Últimos Pedidos</h2>
        <p className="text-xs text-muted-foreground">Média de {orders.length > 0 ? orders.length : 57} pedidos por dia</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ID do Pedido</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Criado</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lucro</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const status = statusConfig[order.status];
                const lucro = order.valor * 0.12;
                return (
                  <TableRow
                    key={order.id}
                    className="hover:bg-accent/20 cursor-pointer border-b border-border/50"
                    onClick={() => navigate(`/pedidos/${order.codigo}`)}
                  >
                    <TableCell className="text-sm font-semibold text-foreground">
                      #{order.codigo}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.data_pedido}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {order.cliente_nome}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      $ {order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">
                      $ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
                        style={{ backgroundColor: status.color + '18', color: status.color, borderColor: status.color + '40' }}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-accent">
                        <Plus size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersTable;
