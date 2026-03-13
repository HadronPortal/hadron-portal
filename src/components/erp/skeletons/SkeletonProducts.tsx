import { Skeleton } from '@/components/ui/skeleton';

const SkeletonProducts = () => (
  <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full animate-in fade-in duration-300">
    <Skeleton className="h-5 w-28 mb-1" />
    <Skeleton className="h-3 w-44 mb-4" />
    <div className="space-y-1 flex-1 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonProducts;
