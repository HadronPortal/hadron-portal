import { Skeleton } from '@/components/ui/skeleton';

const SkeletonEarnings = () => (
  <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full animate-in fade-in duration-300">
    <Skeleton className="h-8 w-36 mb-1" />
    <Skeleton className="h-3 w-12 mb-6" />
    <div className="flex items-center gap-5 flex-1">
      <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
      <div className="space-y-4 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonEarnings;
