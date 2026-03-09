import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard, ChevronDown } from 'lucide-react';

interface ClienteFull {
  cod: string;
  descricao: string;
  subtexto?: string;
  documento: string;
  local: string;
  vendas: string;
  ultPedido: string;
  ultPedidoOrc?: string;
  cadastro: string;
  tipo: 'todos' | 'novos' | 'positivados';
}

const mockClientes: ClienteFull[] = [
  {
    cod: '15 - 8',
    descricao: 'A SP DISTRIBUIDOR SAO PAULO LTDA',
    documento: '67.567.339/0001-45',
    local: 'ARARAQUARA - SP',
    vendas: '1.225,67 (1)',
    ultPedido: '18/02/2026, 11:58',
    ultPedidoOrc: 'ORC.454',
    cadastro: '13/10/2015',
    tipo: 'positivados',
  },
  {
    cod: '2 - 6',
    descricao: 'A SP PROCION SISTEMAS, SAO PAULO',
    subtexto: 'A SP PROCION SISTEMAS DE S PAU',
    documento: '57.711.657/0001-84',
    local: 'SAO CARLOS - SP',
    vendas: '36,88 (2)',
    ultPedido: '08/01/2026, 00:31',
    ultPedidoOrc: 'ORC.453',
    cadastro: '05/11/2013',
    tipo: 'positivados',
  },
  {
    cod: '51 - 3',
    descricao: 'EDSON FESTAS',
    documento: '10.721.338/0001-96',
    local: 'PORTO FERREIRA - SP',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '19/09/2018',
    tipo: 'todos',
  },
  {
    cod: '205 - 5',
    descricao: 'FUNDICAO JB LTDA',
    subtexto: 'NAO EMITIR NF!',
    documento: '22.575.591/0001-68',
    local: 'FORMIGA - MG',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '01/01/2000',
    tipo: 'todos',
  },
  {
    cod: '5001 - 3',
    descricao: 'A MS DISTR MATO GROSS SUL PR ALIM LT',
    documento: '01.383.805/0001-24',
    local: 'BRASILANDIA - MS',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '01/01/2000',
    tipo: 'todos',
  },
  {
    cod: '18 - 2',
    descricao: 'RAFAEL BESSAS DO COUTO',
    documento: '00.007.441/4606-20',
    local: 'SANTO ANT. DO MONTE - MG',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '23/03/2016',
    tipo: 'novos',
  },
  {
    cod: '84 - 4',
    descricao: 'SHPP BRASIL SERV DE PAGAMENTOS LTDA',
    subtexto: '33379',
    documento: '38.372.267/0001-82',
    local: 'SAO PAULO - SP',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '01/02/2022',
    tipo: 'novos',
  },
  {
    cod: '2301 - 0',
    descricao: 'A CE COMERCIO CEARA DE TUDO LTDA',
    documento: '03.898.720/0001-04',
    local: 'JUAZEIRO DO NORTE - CE',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '24/03/2004',
    tipo: 'todos',
  },
  {
    cod: '13201 - 9',
    descricao: 'ADRIANA SAVIATTO',
    documento: '00.086.241/6727-20',
    local: 'COLATINA - ES',
    vendas: '0,00 ()',
    ultPedido: '09/03/2026, 11:30',
    ultPedidoOrc: 'ORC.',
    cadastro: '01/01/2000',
    tipo: 'todos',
  },
];

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'novos', label: 'Novos' },
  { key: 'positivados', label: 'Positivados' },
] as const;

const Clientes = () => {
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const filtered = activeTab === 'todos'
    ? mockClientes
    : mockClientes.filter((c) => c.tipo === activeTab);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-erp-navy text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="appearance-none border border-border rounded-md pl-3 pr-7 py-1.5 text-sm bg-card text-foreground h-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

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
                  <TableHead className="text-xs font-bold text-foreground">COD</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DESCRICAO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DOCUMENTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">LOCAL</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">VENDAS</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">ULT PEDIDO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">CADASTRO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">AÇÃO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, rowsPerPage).map((cliente) => (
                  <TableRow key={cliente.cod} className="hover:bg-accent/30">
                    <TableCell className="text-sm whitespace-nowrap">{cliente.cod}</TableCell>
                    <TableCell className="text-sm">
                      <span className="font-semibold underline cursor-pointer">{cliente.descricao}</span>
                      {cliente.subtexto && (
                        <div className="text-xs text-muted-foreground">{cliente.subtexto}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{cliente.documento}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{cliente.local}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{cliente.vendas}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {cliente.ultPedido}
                      {cliente.ultPedidoOrc && (
                        <div className="text-xs text-muted-foreground">{cliente.ultPedidoOrc}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{cliente.cadastro}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button className="text-muted-foreground hover:text-foreground" title="Ver">
                          <Eye size={16} />
                        </button>
                        <button className="text-muted-foreground hover:text-foreground" title="Pedidos">
                          <CreditCard size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Clientes;
