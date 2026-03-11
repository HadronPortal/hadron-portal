import { cn } from '@/lib/utils';

const Spinner = ({ size = 32, className }: { size?: number; className?: string }) => (
  <div className={cn("flex items-center justify-center py-16", className)}>
    <div
      className="rounded-full border-[3px] border-muted border-t-primary animate-spin"
      style={{ width: size, height: size }}
    />
  </div>
);

export default Spinner;