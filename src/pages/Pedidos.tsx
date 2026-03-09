import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText } from 'lucide-react';

interface PedidoFull {
  codigo: string;
  codCliente: string;
  cliente: string;
  subtexto?: string;
  documento: string;
  localizacao: string;
  status: string;
  statusColor: string;
  valor: string;
  pesoKg: string;
  data: string;
  erpCode?: string;
}

const mockPedidos: PedidoFull[] = [
  {
    codigo: '454',
    codCliente: '15',
    cliente: 'A SP DISTRIBUIDOR SAO PAULO LTDA',
    documento: '67.567.339/0001-45',
    localizacao: 'ARARAQUARA - SP',
    status: 'Pedido Aprovado',
    statusColor: 'bg-orange-500',
    valor: 'R$1.225,67',
    pesoKg: '10',
    data: '18/02/2026, 11:58',
    erpCode: 'ERP:2274',
  },
  {
    codigo: '453',
    codCliente: '2',
    cliente: 'A SP PROCION SISTEMAS, SAO PAULO',
    subtexto: 'A SP PROCION SISTEMAS DE S PAU',
    documento: '57.711.657/0001-84',
    localizacao: 'SAO CARLOS - SP',
    status: 'Pagamento Confirmado',
    statusColor: 'bg-green-500',
    valor: 'R$18,44',
    pesoKg: '0,25',
    data: '08/01/2026, 00:31',
  },
];

const kpiCards = [
  { label: 'Enviados', valor: 'R$ 18,44', peso: '0,25 Kg', color: 'bg-teal-600' },
  { label: 'Aprovados', valor: 'R$ 1.225,67', peso: '10 Kg', color: 'bg-orange-500' },
  { label: 'Faturados', valor: 'R$ 0', peso: '0 Kg', color: 'bg-cyan-500' },
  { label: 'Cancelados', valor: 'R$ 0', peso: '0 Kg', color: 'bg-blue-700' },
];

const Pedidos = () => {
  const [rowsPerPage, setRowsPerPage] = useState(50);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className={`${kpi.color} text-white rounded-lg p-4 relative`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{kpi.label}</span>
                <FileText size={18} className="opacity-70" />
              </div>
              <div className="text-lg font-bold mt-1">{kpi.valor}</div>
              <div className="text-xs opacity-80">{kpi.peso}</div>
            </div>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-border rounded px-1.5 py-0.5 text-xs bg-card text-foreground w-16"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-muted-foreground mt-0.5">registros</span>
          </div>

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">CODIGO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">CLIENTE</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DOCUMENTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">LOCALIZACAO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">STATUS</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">VALOR</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">PESO(KG)</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DATA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPedidos.slice(0, rowsPerPage).map((pedido) => (
                  <TableRow key={pedido.codigo} className="hover:bg-accent/30">
                    <TableCell className="text-sm">{pedido.codigo}</TableCell>
                    <TableCell className="text-sm">
                      <div>{pedido.codCliente} - {pedido.cliente}</div>
                      {pedido.subtexto && (
                        <div className="text-xs text-muted-foreground">{pedido.subtexto}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{pedido.documento}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{pedido.localizacao}</TableCell>
                    <TableCell className="text-sm">
                      <span className={`${pedido.statusColor} text-white text-xs px-2 py-1 rounded`}>
                        {pedido.status}
                      </span>
                      {pedido.erpCode && (
                        <div className="text-xs text-muted-foreground mt-1">{pedido.erpCode}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{pedido.valor}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{pedido.pesoKg}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{pedido.data}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando de 1 até {mockPedidos.length} de {mockPedidos.length} registros.</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 border border-border rounded text-xs hover:bg-accent">&lt;&lt;</button>
            <button className="px-2 py-1 border border-border rounded text-xs hover:bg-accent">&lt;</button>
            <button className="px-2 py-1 border border-primary bg-primary text-primary-foreground rounded text-xs">1</button>
            <button className="px-2 py-1 border border-border rounded text-xs hover:bg-accent">&gt;</button>
            <button className="px-2 py-1 border border-border rounded text-xs hover:bg-accent">&gt;&gt;</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pedidos;
