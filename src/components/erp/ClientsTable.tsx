import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Client } from '@/lib/mock-data';

const ClientsTable = ({ clients }: { clients: Client[] }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">ÚLTIMOS CLIENTES</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50">
              <TableHead className="text-[11px] font-semibold tracking-wider">CLIENTE</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">LOCALIZAÇÃO</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider">DATA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell className="text-xs font-medium">{client.nome}</TableCell>
                  <TableCell className="text-xs">{client.localizacao}</TableCell>
                  <TableCell className="text-xs">{client.data_cadastro}</TableCell>
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
