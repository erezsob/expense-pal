import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <Loader2
      className={cn('text-primary/60 my-28 h-16 w-16 animate-spin', className)}
    />
  );
};
