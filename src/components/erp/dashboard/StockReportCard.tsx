import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface StockItem {
  name: string;
  productId: string;
  date: string;
  price: number;
  status: string;
  statusBg: string;
  statusText: string;
  quantity: number;
}

const stockItems: StockItem[] = [
  { name: 'Parafuso Sextavado', productId: '#XGY-356', date: '02 de abril de 2026', price: 1230, status: 'Em estoque', statusBg: 'bg-sky-100', statusText: 'text-sky-600', quantity: 58 },
  { name: 'Válvula Industrial', productId: '#YHD-047', date: '01 de abril de 2026', price: 1060, status: 'Fora de estoque', statusBg: 'bg-red-100', statusText: 'text-red-500', quantity: 0 },
  { name: 'Luva de Proteção', productId: '#SRR-678', date: '24 de março de 2026', price: 64, status: 'Em estoque', statusBg: 'bg-sky-100', statusText: 'text-sky-600', quantity: 120 },
  { name: 'Resina Epóxi', productId: '#PXF-578', date: '24 de março de 2026', price: 1060, status: 'Fora de estoque', statusBg: 'bg-red-100', statusText: 'text-red-500', quantity: 46 },
  { name: 'Tubo de Ensaio', productId: '#PXF-778', date: '16 de janeiro de 2026', price: 4500, status: 'Em estoque', statusBg: 'bg-sky-100', statusText: 'text-sky-600', quantity: 78 },
  { name: 'Fita Isolante', productId: '#XGY-356', date: '22 de dezembro de 2025', price: 1060, status: 'Poucas unidades', statusBg: 'bg-yellow-100', statusText: 'text-yellow-600', quantity: 8 },
  { name: 'Óleo Lubrificante', productId: '#XVR-425', date: '27 de dezembro de 2025', price: 1060, status: 'Em estoque', statusBg: 'bg-sky-100', statusText: 'text-sky-600', quantity: 124 },
];

const StockReportCard = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Relatório de ações</h3>
          <p className="text-xs text-muted-foreground">Total de 2.356 itens em estoque</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Categoria</span>
            <Select defaultValue="all">
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-1 w-auto gap-1">
                <SelectValue placeholder="Mostrar tudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mostrar tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status</span>
            <Select defaultValue="all">
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-1 w-auto gap-1">
                <SelectValue placeholder="Mostrar tudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mostrar tudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button className="text-xs font-medium text-primary hover:underline">Ver ações</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ID do Produto</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data de Adição</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Preço</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Quan.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockItems.map((item, i) => (
              <TableRow key={i} className="border-b border-border/50 hover:bg-accent/20">
                <TableCell className="text-sm font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.productId}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                <TableCell className="text-sm text-foreground">$ {item.price.toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${item.statusBg} ${item.statusText}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm font-semibold text-foreground text-right">{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StockReportCard;
