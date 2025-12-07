// =====================================
// FLUX - Atomic Card Component
// Style: Elevated depth with thick shadows
// =====================================

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'flat' | 'outline' | 'ghost' | 'hover' | 'gradient' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

const cardVariants = {
    // Default - subtle elevation
    default: 'bg-card text-card-foreground border border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]',
    
    // Flat - no elevation
    flat: 'bg-muted/50 text-card-foreground border-0',
    
    // Outline - border only
    outline: 'bg-transparent text-card-foreground border border-border',
    
    // Ghost - minimal
    ghost: 'bg-transparent text-card-foreground border-0',
    
    // Hover - interactive with lift effect
    hover: `bg-card text-card-foreground border border-border/50 
            shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]
            hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)]
            hover:border-violet-200/50 dark:hover:border-violet-700/50
            hover:-translate-y-1
            active:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2)] dark:active:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.4)]
            active:translate-y-0
            transition-all duration-200 ease-out`,
    
    // Gradient - accent card
    gradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0 shadow-[0_8px_30px_-6px_rgba(139,92,246,0.4)]',
    
    // Elevated - maximum depth (for hero cards)
    elevated: `bg-card text-card-foreground border border-border/30
               shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15),0_4px_10px_-4px_rgba(0,0,0,0.1)] 
               dark:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.4),0_4px_10px_-4px_rgba(0,0,0,0.3)]
               hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2),0_8px_20px_-8px_rgba(0,0,0,0.15)]
               dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5),0_8px_20px_-8px_rgba(0,0,0,0.4)]
               hover:-translate-y-1
               active:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.15)] dark:active:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.35)]
               active:translate-y-0
               transition-all duration-200 ease-out`,
};

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', interactive, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl',
                    cardVariants[variant],
                    paddingStyles[padding],
                    interactive && 'cursor-pointer',
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
