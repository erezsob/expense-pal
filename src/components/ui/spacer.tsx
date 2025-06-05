import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  orientation?: 'vertical' | 'horizontal'
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size = 'md', orientation = 'vertical', ...props }, ref) => {
    const sizeMap = {
      xs: 'h-2 w-2',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    }

    return (
      <div
        ref={ref}
        className={cn(
          orientation === 'vertical' ? 'w-full' : 'h-full',
          sizeMap[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Spacer.displayName = 'Spacer'

export { Spacer }
