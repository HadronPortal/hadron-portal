import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Client } from '@/lib/mock-data';

const ClientsTable = ({ clients }: { clients: Client[] }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--erp-blue))' }}>
          Últimos Clientes ({clients.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold text-foreground">CLIENTE</TableHead>
              <TableHead className="text-xs font-bold text-foreground">LOCALIZACAO</TableHead>
              <TableHead className="text-xs font-bold text-foreground">DATA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  ---
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-accent/30">
                  <TableCell className="text-sm">{client.nome}</TableCell>
                  <TableCell className="text-sm">{client.localizacao}</TableCell>
                  <TableCell className="text-sm">{client.data_cadastro}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientsTable;
