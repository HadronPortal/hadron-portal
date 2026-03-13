import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface Props {
  columns: number;
  rows?: number;
  headers?: string[];
}

const SkeletonTable = ({ columns, rows = 8, headers }: Props) => (
  <div className="bg-card rounded-lg border border-border overflow-hidden animate-in fade-in duration-300">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers
              ? headers.map((h, i) => (
                  <TableHead key={i} className="text-xs font-bold text-foreground">{h}</TableHead>
                ))
              : Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-4 w-full max-w-[120px]" style={{ width: `${60 + Math.random() * 40}%` }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default SkeletonTable;
