import { Skeleton } from '@/components/ui/skeleton';

const SkeletonCustomers = () => (
  <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full animate-in fade-in duration-300">
    <Skeleton className="h-8 w-12 mb-1" />
    <Skeleton className="h-3 w-32 mb-6" />
    <div className="mt-auto">
      <Skeleton className="h-4 w-28 mb-3" />
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`w-10 h-10 rounded-full ${i > 0 ? '-ml-2' : ''}`} />
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonCustomers;
