import { Skeleton } from '@/components/ui/skeleton';

const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-xl px-5 py-5 flex flex-col gap-3 animate-in fade-in duration-300">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
    <div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
    <Skeleton className="h-3 w-16" />
  </div>
);

export default SkeletonCard;
