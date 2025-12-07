// =====================================
// FLUX - Atomic Card Component
// Style: Clean Modern SaaS (SlothUI)
// =====================================

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'flat' | 'outline' | 'ghost' | 'hover' | 'gradient';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

const cardVariants = {
    default: 'bg-card text-card-foreground border border-border shadow-sm',
    flat: 'bg-muted/50 text-card-foreground border-0',
    outline: 'bg-transparent text-card-foreground border border-border',
    ghost: 'bg-transparent text-card-foreground border-0',
    hover: 'bg-card text-card-foreground border border-border shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-200',
    gradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0 shadow-lg',
};

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5', // Increased default padding for spacious feel
    lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', interactive, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl', // Modern rounded corners
                    cardVariants[variant],
                    paddingStyles[padding],
                    interactive && 'cursor-pointer hover:shadow-md transition-shadow duration-200',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card sub-components
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-lg font-bold text-card-foreground tracking-tight', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn('text-sm text-muted-foreground font-medium', className)} {...props}>
            {children}
        </p>
    );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex items-center mt-4 pt-4 border-t border-border', className)} {...props}>
            {children}
        </div>
    );
}
