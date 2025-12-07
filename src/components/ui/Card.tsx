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
    // Default - Floating shadow with smooth transitions
    default: `bg-card text-card-foreground border border-border/40 
              shadow-[0_12px_35px_-8px_rgba(0,0,0,0.18),0_6px_15px_-5px_rgba(0,0,0,0.12)] 
              dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.55),0_6px_15px_-5px_rgba(0,0,0,0.35)]
              transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`,
    
    // Flat - no elevation
    flat: 'bg-muted/50 text-card-foreground border-0 transition-colors duration-200',
    
    // Outline - border only
    outline: 'bg-transparent text-card-foreground border border-border transition-all duration-200',
    
    // Ghost - minimal
    ghost: 'bg-transparent text-card-foreground border-0 transition-all duration-200',
    
    // Hover - Buttery smooth lift and shadow transitions
    hover: `bg-card text-card-foreground border border-border/40 
            shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15),0_4px_12px_-4px_rgba(0,0,0,0.1)] 
            dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.45),0_4px_12px_-4px_rgba(0,0,0,0.3)]
            hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18),0_8px_20px_-5px_rgba(0,0,0,0.12)] 
            dark:hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5),0_8px_20px_-5px_rgba(0,0,0,0.35)]
            hover:border-orange-200/70 dark:hover:border-orange-500/50
            hover:-translate-y-1
            active:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.12),0_2px_8px_-3px_rgba(0,0,0,0.08)] 
            dark:active:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.4),0_2px_8px_-3px_rgba(0,0,0,0.25)]
            active:translate-y-0
            transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`,
    
    // Gradient - accent card with smooth glow
    gradient: `bg-gradient-to-br from-[#E67D22] to-[#C15F3C] text-white border-0 
               shadow-[0_14px_45px_-10px_rgba(230,125,34,0.45)]
               hover:shadow-[0_20px_50px_-10px_rgba(230,125,34,0.6)]
               transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`,
    
    // Elevated - Maximum depth with buttery smooth shadows
    elevated: `bg-card text-card-foreground border border-border/30
               shadow-[0_10px_40px_-10px_rgba(0,0,0,0.18),0_6px_16px_-5px_rgba(0,0,0,0.12)] 
               dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),0_6px_16px_-5px_rgba(0,0,0,0.35)]
               hover:shadow-[0_16px_50px_-12px_rgba(0,0,0,0.2),0_10px_24px_-6px_rgba(0,0,0,0.14)]
               dark:hover:shadow-[0_16px_50px_-12px_rgba(0,0,0,0.55),0_10px_24px_-6px_rgba(0,0,0,0.4)]
               hover:-translate-y-1
               active:shadow-[0_6px_20px_-6px_rgba(0,0,0,0.12),0_3px_10px_-3px_rgba(0,0,0,0.08)] 
               dark:active:shadow-[0_6px_20px_-6px_rgba(0,0,0,0.4),0_3px_10px_-3px_rgba(0,0,0,0.25)]
               active:translate-y-0
               transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`,
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
