import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Order } from '@/lib/mock-data';

const statusConfig: Record<Order['status'], { label: string; className: string }> = {
  aprovado: { label: 'Pedido aprovado', className: 'bg-[hsl(var(--erp-orange))]/15 text-[hsl(var(--erp-orange))] border-[hsl(var(--erp-orange))]/30' },
  confirmado: { label: 'Pagamento confirmado', className: 'bg-[hsl(var(--erp-green))]/15 text-[hsl(var(--erp-green))] border-[hsl(var(--erp-green))]/30' },
  pendente: { label: 'Pedido pendente', className: 'bg-muted text-muted-foreground border-border' },
};

const OrdersTable = ({ orders }: { orders: Order[] }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">ÚLTIMOS PEDIDOS</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50">
              <TableHead className="text-[11px] font-semibold tracking-wider">CÓDIGO</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">CLIENTE</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">LOCALIZAÇÃO</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">STATUS</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-right">VALOR</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">DATA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const status = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-mono text-xs font-medium">{order.codigo}</TableCell>
                    <TableCell>
                      <div className="text-xs font-medium">{order.cliente_nome}</div>
                      <div className="text-[10px] text-muted-foreground">{order.cliente_cnpj}</div>
                    </TableCell>
                    <TableCell className="text-xs">{order.localizacao}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {order.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs">{order.data_pedido}</TableCell>
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
