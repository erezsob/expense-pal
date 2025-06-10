import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'subtle' | 'lead' | 'large' | 'small';
  as?: 'p' | 'span' | 'div';
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = 'default', as: Component = 'p', ...props }, ref) => {
    const variantStyles = {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      subtle: 'text-muted-foreground/70',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm text-muted-foreground',
    };

    return (
      <Component
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      />
    );
  },
);

Text.displayName = 'Text';

export { Text };
