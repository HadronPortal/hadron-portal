import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Order } from '@/lib/mock-data';

const statusConfig: Record<Order['status'], { label: string; bg: string; text: string }> = {
  aprovado: { label: 'Pedido Aprovado', bg: 'bg-orange-400', text: 'text-white' },
  confirmado: { label: 'Pagamento Confirmado', bg: 'bg-green-500', text: 'text-white' },
  pendente: { label: 'Pedido Pendente', bg: 'bg-yellow-700', text: 'text-white' },
};

const OrdersTable = ({ orders }: { orders: Order[] }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--erp-blue))' }}>
          Últimos Pedidos
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold text-foreground">CODIGO</TableHead>
              <TableHead className="text-xs font-bold text-foreground">CLIENTE</TableHead>
              <TableHead className="text-xs font-bold text-foreground">LOCALIZACAO</TableHead>
              <TableHead className="text-xs font-bold text-foreground">STATUS</TableHead>
              <TableHead className="text-xs font-bold text-foreground">VALOR</TableHead>
              <TableHead className="text-xs font-bold text-foreground">DATA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  ---
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const status = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-accent/30">
                    <TableCell className="text-sm">{order.codigo}</TableCell>
                    <TableCell>
                      <div className="text-sm">{order.cliente_nome}</div>
                      <div className="text-xs text-muted-foreground">{order.cliente_cnpj}</div>
                    </TableCell>
                    <TableCell className="text-sm">{order.localizacao}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-4 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                      {order.erp_code && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{order.erp_code}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      R${order.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm">{order.data_pedido}</TableCell>
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
