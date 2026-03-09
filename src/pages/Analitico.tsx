import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { productImages } from '@/lib/product-images';

interface ProdutoAnalitico {
  id: string;
  produto: string;
  img: string;
  mesValor: string;
  mesQtd: string;
  mesPeso: string;
  totalValor: string;
  totalQtd: string;
  totalPeso: string;
  tipo: 'todos' | 'vendas' | 'bonificacao' | 'amostra';
}

const mockProdutos: ProdutoAnalitico[] = [
  { id: '1', produto: '1002-PIMENTA VERMELHA', img: 'pimenta', mesValor: 'R$ 1.225,67', mesQtd: '(10)', mesPeso: '10 Kg', totalValor: 'R$ 1.225,67', totalQtd: '(10)', totalPeso: '10 Kg', tipo: 'vendas' },
  { id: '2', produto: '1003-BORRACHA ALTO IMPACTO', img: 'borracha', mesValor: 'R$ 3.450,00', mesQtd: '(25)', mesPeso: '25 Kg', totalValor: 'R$ 3.450,00', totalQtd: '(25)', totalPeso: '25 Kg', tipo: 'vendas' },
  { id: '3', produto: '1005-GASOLINA PREMIUM', img: 'gasolina', mesValor: 'R$ 45.330,00', mesQtd: '(500)', mesPeso: '1.000 Kg', totalValor: 'R$ 45.330,00', totalQtd: '(500)', totalPeso: '1.000 Kg', tipo: 'vendas' },
  { id: '4', produto: '1006-DESODORANTE IMPORTADO', img: 'desodorante', mesValor: 'R$ 735,90', mesQtd: '(12)', mesPeso: '8 Kg', totalValor: 'R$ 735,90', totalQtd: '(12)', totalPeso: '8 Kg', tipo: 'amostra' },
  { id: '5', produto: '1009-BANANA NANICA', img: 'banana', mesValor: 'R$ 12.000,00', mesQtd: '(200)', mesPeso: '500 Kg', totalValor: 'R$ 12.000,00', totalQtd: '(200)', totalPeso: '500 Kg', tipo: 'vendas' },
  { id: '6', produto: '1010-CAFE TORRADO ESPECIAL', img: 'cafe', mesValor: 'R$ 8.925,00', mesQtd: '(75)', mesPeso: '75 Kg', totalValor: 'R$ 8.925,00', totalQtd: '(75)', totalPeso: '75 Kg', tipo: 'bonificacao' },
  { id: '7', produto: '1012-PARAFUSO INOX M8', img: 'parafuso', mesValor: 'R$ 5.600,00', mesQtd: '(1000)', mesPeso: '200 Kg', totalValor: 'R$ 5.600,00', totalQtd: '(1000)', totalPeso: '200 Kg', tipo: 'bonificacao' },
  { id: '8', produto: '1014-FITA ADESIVA INDUSTRIAL', img: 'fita', mesValor: 'R$ 960,00', mesQtd: '(80)', mesPeso: '12 Kg', totalValor: 'R$ 960,00', totalQtd: '(80)', totalPeso: '12 Kg', tipo: 'amostra' },
  { id: '9', produto: '1015-CIMENTO PORTLAND CP-V', img: 'cimento', mesValor: 'R$ 22.500,00', mesQtd: '(300)', mesPeso: '1.500 Kg', totalValor: 'R$ 22.500,00', totalQtd: '(300)', totalPeso: '1.500 Kg', tipo: 'vendas' },
  { id: '10', produto: '1016-LUVA LATEX PROCEDIMENTO', img: 'luva', mesValor: 'R$ 3.750,00', mesQtd: '(500)', mesPeso: '40 Kg', totalValor: 'R$ 3.750,00', totalQtd: '(500)', totalPeso: '40 Kg', tipo: 'bonificacao' },
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

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
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
            <span className="text-xs text-muted-foreground mt-0.5">registros</span>
          </div>

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

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
                        <img
                          src={productImages[produto.img]}
                          alt={produto.produto}
                          className="w-10 h-10 object-contain rounded bg-muted"
                        />
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

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando de 1 até {filtered.length} de {filtered.length} registros.</span>
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
