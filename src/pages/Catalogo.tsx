import { useState } from 'react';
import Header from '@/components/erp/Header';
import FilterBar from '@/components/erp/FilterBar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { productImages } from '@/lib/product-images';

interface CatalogoItem {
  codProd: string;
  img: string;
  descricao: string;
  grupo: string;
  prevSaida: number;
  prevEntrada: number;
  saldoAtual: string;
  saldoFuturo: number;
}

const mockCatalogo: CatalogoItem[] = [
  { codProd: '1', img: 'banana', descricao: 'BANANA', grupo: 'FRUTAS', prevSaida: 0, prevEntrada: 0, saldoAtual: '500', saldoFuturo: 0 },
  { codProd: '201', img: 'tubo-ensaio', descricao: 'TUBO DE ENSAIO', grupo: 'VIDRO E SUAS OBRAS', prevSaida: 0, prevEntrada: 0, saldoAtual: '1.234,56', saldoFuturo: 0 },
  { codProd: '303', img: 'ponta', descricao: 'PONTA PERFURADORA MS SJ8D', grupo: 'REATORES, CALDEIRAS, MAQUINAS,', prevSaida: 0, prevEntrada: 0, saldoAtual: '498', saldoFuturo: 0 },
  { codProd: '1000', img: 'valvula', descricao: 'VALVULA IMPORTADA', grupo: 'REATORES, CALDEIRAS, MAQUINAS,', prevSaida: 0, prevEntrada: 0, saldoAtual: '658', saldoFuturo: 0 },
  { codProd: '1001', img: 'desodorante', descricao: 'DESODORANTE IMPORTADO TERCEIROS', grupo: 'OLEOS ESSENCIAIS E RESINOIDES', prevSaida: 0, prevEntrada: 90, saldoAtual: '735', saldoFuturo: 825 },
  { codProd: '1002', img: 'pimenta', descricao: 'PIMENTA VERMELHA', grupo: 'CAFE, CHA, ESPECIARIAS', prevSaida: 0, prevEntrada: 0, saldoAtual: '4.337', saldoFuturo: 0 },
  { codProd: '1003', img: 'borracha', descricao: 'BORRACHA ALTO IMPACTO', grupo: 'BORRACHA E SUAS OBRAS', prevSaida: 0, prevEntrada: 0, saldoAtual: '4.979', saldoFuturo: 0 },
  { codProd: '1004', img: 'coleira', descricao: 'COLEIRA DE COURO FORRADA WEB', grupo: 'OBRAS DE COURO', prevSaida: 0, prevEntrada: 0, saldoAtual: '882', saldoFuturo: 0 },
  { codProd: '1005', img: 'gasolina', descricao: 'GASOLINA', grupo: 'COMBUSTIVEIS/OLEOS MINERAIS', prevSaida: 0, prevEntrada: 0, saldoAtual: '4.765.533', saldoFuturo: 0 },
];

const Catalogo = () => {
  const [rowsPerPage, setRowsPerPage] = useState(50);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 px-6 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Catalogo</h1>

        <div className="flex items-center justify-between">
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

          <Button variant="outline" size="sm" className="gap-1">
            Colunas <ChevronDown size={14} />
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">COD PROD</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">FOTO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">DESCRICAO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">GRUPO</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">PREV SAÍDA</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">PREV ENTRADA</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">SALDO ATUAL</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">SALDO FUTURO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCatalogo.slice(0, rowsPerPage).map((item) => (
                  <TableRow key={item.codProd} className="hover:bg-accent/30">
                    <TableCell className="text-sm">{item.codProd}</TableCell>
                    <TableCell>
                      <img
                        src={productImages[item.img]}
                        alt={item.descricao}
                        className="w-14 h-14 object-contain rounded bg-muted"
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{item.descricao}</TableCell>
                    <TableCell className="text-sm">{item.grupo}</TableCell>
                    <TableCell className="text-sm text-right">{item.prevSaida}</TableCell>
                    <TableCell className="text-sm text-right">{item.prevEntrada}</TableCell>
                    <TableCell className="text-sm text-right">{item.saldoAtual}</TableCell>
                    <TableCell className="text-sm text-right">{item.saldoFuturo}</TableCell>
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

export default Catalogo;
