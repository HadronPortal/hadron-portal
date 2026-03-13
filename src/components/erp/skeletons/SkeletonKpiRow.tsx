import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  count?: number;
}

const SkeletonKpiRow = ({ count = 4 }: Props) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 animate-in fade-in duration-300`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-muted/60 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-6 w-28 mt-2" />
        <Skeleton className="h-3 w-16 mt-1" />
      </div>
    ))}
  </div>
);

export default SkeletonKpiRow;
