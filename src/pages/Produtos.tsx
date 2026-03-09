import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface ProdutoItem {
  cod: string;
  descricao: string;
  qtde: string;
  peso: string;
  valor: string;
  tipo: 'todos' | 'amostra' | 'bonificados';
}

const mockProdutos: ProdutoItem[] = [
  {
    cod: '1002',
    descricao: 'PIMENTA VERMELHA',
    qtde: '10.000',
    peso: '10kg',
    valor: 'R$1.225,67',
    tipo: 'todos',
  },
];

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'amostra', label: 'Amostra Grátis' },
  { key: 'bonificados', label: 'Bonificados' },
] as const;

const Produtos = () => {
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');

  const filtered = (activeTab === 'todos'
    ? mockProdutos
    : mockProdutos.filter((p) => p.tipo === activeTab)
  ).filter((p) => p.descricao.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>

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

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Pesquisar</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 h-8 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">COD</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">FOTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DESCRICAO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">QTDE</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">PESO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">VALOR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, rowsPerPage).map((produto) => (
                  <TableRow key={produto.cod} className="hover:bg-accent/30">
                    <TableCell className="text-sm">{produto.cod}</TableCell>
                    <TableCell>
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-lg">
                        🌶️
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{produto.descricao}</TableCell>
                    <TableCell className="text-sm">{produto.qtde}</TableCell>
                    <TableCell className="text-sm">{produto.peso}</TableCell>
                    <TableCell className="text-sm">{produto.valor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando de 1 até {filtered.length} de {filtered.length} registros.</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent">Primeira</button>
            <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent">Anterior</button>
            <button className="px-3 py-1 border border-primary bg-primary text-primary-foreground rounded text-xs">1</button>
            <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent">Próxima</button>
            <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent">Última</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Produtos;
