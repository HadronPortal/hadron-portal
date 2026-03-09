import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ProdutoAnalitico {
  id: string;
  produto: string;
  imagemPlaceholder?: boolean;
  mesValor: string;
  mesQtd: string;
  mesPeso: string;
  totalValor: string;
  totalQtd: string;
  totalPeso: string;
  tipo: 'todos' | 'vendas' | 'bonificacao' | 'amostra';
}

const mockProdutos: ProdutoAnalitico[] = [
  {
    id: '1',
    produto: '1002-PIMENTA VERMELHA',
    imagemPlaceholder: true,
    mesValor: 'R$ 1.225,67',
    mesQtd: '(10)',
    mesPeso: '10 Kg',
    totalValor: 'R$ 1.225,67',
    totalQtd: '(10)',
    totalPeso: '10 Kg',
    tipo: 'vendas',
  },
];

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'bonificacao', label: 'Bonificação' },
  { key: 'amostra', label: 'Amostra Grátis' },
] as const;

const Analitico = () => {
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const filtered = activeTab === 'todos'
    ? mockProdutos
    : mockProdutos.filter((p) => p.tipo === activeTab);

  // Totals
  const totalMesValor = 'R$ 1.225,67';
  const totalMesPeso = '10Kg';
  const totalGeralValor = 'R$ 1.225,67';
  const totalGeralPeso = '10Kg';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Analitico Período</h1>

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
                  <TableHead className="text-xs font-bold text-foreground">PRODUTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Fevereiro/26</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((produto) => (
                  <TableRow key={produto.id} className="hover:bg-accent/30">
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-3">
                        {produto.imagemPlaceholder && (
                          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                            📦
                          </div>
                        )}
                        <span className="font-semibold">{produto.produto}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{produto.mesValor} {produto.mesQtd}</div>
                      <div className="text-xs text-muted-foreground">{produto.mesPeso}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="text-foreground">{produto.totalValor} {produto.totalQtd}</div>
                      <div className="text-xs text-muted-foreground">{produto.totalPeso}</div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total row */}
                <TableRow className="border-t-2 border-border">
                  <TableCell className="text-sm font-bold text-foreground">TOTAL</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-bold text-foreground">{totalMesValor}</div>
                    <div className="text-xs font-bold text-foreground">{totalMesPeso}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-bold text-foreground">{totalGeralValor}</div>
                    <div className="text-xs font-bold text-foreground">{totalGeralPeso}</div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando de 1 até 1 de 1 registros.</span>
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

export default Analitico;
