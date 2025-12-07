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
    // Default - moderate floating shadow
    default: 'bg-card text-card-foreground border border-border/50 shadow-[0_8px_25px_-5px_rgba(0,0,0,0.12),0_4px_10px_-3px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.4),0_4px_10px_-3px_rgba(0,0,0,0.25)]',
    
    // Flat - no elevation
    flat: 'bg-muted/50 text-card-foreground border-0',
    
    // Outline - border only
    outline: 'bg-transparent text-card-foreground border border-border',
    
    // Ghost - minimal
    ghost: 'bg-transparent text-card-foreground border-0',
    
    // Hover - lifts on hover, drops with MORE shadow on press
    hover: `bg-card text-card-foreground border border-border/50 
            shadow-[0_8px_25px_-5px_rgba(0,0,0,0.12),0_4px_10px_-3px_rgba(0,0,0,0.08)] 
            dark:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.4),0_4px_10px_-3px_rgba(0,0,0,0.25)]
            hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.1),0_3px_8px_-2px_rgba(0,0,0,0.05)] 
            dark:hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.35),0_3px_8px_-2px_rgba(0,0,0,0.2)]
            hover:border-violet-200/50 dark:hover:border-violet-600/50
            hover:-translate-y-1
            active:shadow-[0_12px_35px_-3px_rgba(0,0,0,0.2),0_6px_15px_-2px_rgba(0,0,0,0.15)] 
            dark:active:shadow-[0_12px_35px_-3px_rgba(0,0,0,0.55),0_6px_15px_-2px_rgba(0,0,0,0.35)]
            active:translate-y-0.5
            transition-all duration-200 ease-out`,
    
    // Gradient - accent card
    gradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0 shadow-[0_10px_35px_-8px_rgba(139,92,246,0.5)]',
    
    // Elevated - premium depth with thick shadows
    elevated: `bg-card text-card-foreground border border-border/30
               shadow-[0_10px_35px_-8px_rgba(0,0,0,0.18),0_5px_15px_-5px_rgba(0,0,0,0.12)] 
               dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.5),0_5px_15px_-5px_rgba(0,0,0,0.35)]
               hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.12),0_4px_10px_-3px_rgba(0,0,0,0.08)]
               dark:hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.4),0_4px_10px_-3px_rgba(0,0,0,0.25)]
               hover:-translate-y-1
               active:shadow-[0_14px_45px_-5px_rgba(0,0,0,0.22),0_8px_20px_-4px_rgba(0,0,0,0.18)] 
               dark:active:shadow-[0_14px_45px_-5px_rgba(0,0,0,0.6),0_8px_20px_-4px_rgba(0,0,0,0.4)]
               active:translate-y-0.5
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
