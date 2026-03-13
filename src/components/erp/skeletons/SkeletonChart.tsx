import { Skeleton } from '@/components/ui/skeleton';

const SkeletonChart = () => (
  <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full animate-in fade-in duration-300">
    <Skeleton className="h-5 w-24 mb-1" />
    <Skeleton className="h-3 w-36 mb-4" />
    <Skeleton className="h-9 w-40 mb-1" />
    <Skeleton className="h-3 w-32 mb-6" />
    <div className="flex-1 min-h-[200px] flex items-end gap-2 pb-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </div>
);

export default SkeletonChart;
