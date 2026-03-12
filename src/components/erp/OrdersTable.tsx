import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
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

const statusConfig: Record<Order['status'], { label: string; bg: string; text: string }> = {
  enviado: { label: 'Enviado', bg: 'bg-green-100', text: 'text-green-600' },
  aprovado: { label: 'Aprovado', bg: 'bg-orange-100', text: 'text-orange-600' },
  confirmado: { label: 'Confirmado', bg: 'bg-sky-100', text: 'text-sky-600' },
  pendente: { label: 'Pendente', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  cancelado: { label: 'Rejeitado', bg: 'bg-red-100', text: 'text-red-500' },
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
      {/* Header */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Últimos Pedidos</h2>
          <p className="text-xs text-muted-foreground">Média de {orders.length > 0 ? orders.length : 57} pedidos por dia</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Categoria</span>
            <Select defaultValue="all">
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-1 w-auto gap-1">
                <SelectValue placeholder="Mostrar tudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mostrar tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status</span>
            <Select defaultValue="all">
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-1 w-auto gap-1">
                <SelectValue placeholder="Mostrar tudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mostrar tudo</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Procurar" className="h-7 text-xs pl-7 w-32 rounded-lg" />
          </div>
        </div>
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
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${status.bg} ${status.text}`}>
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
