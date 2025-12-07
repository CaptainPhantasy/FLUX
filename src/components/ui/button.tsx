import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  // Base styles with buttery smooth transitions
  `inline-flex items-center justify-center whitespace-nowrap text-sm font-medium 
   ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-50 
   transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
   active:scale-[0.97] active:duration-100`,
  {
    variants: {
      variant: {
        primary:
          `bg-gradient-to-r from-[#E67D22] to-[#C15F3C] text-white 
           shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 
           hover:brightness-110 border-0`,
        secondary:
          `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 
           border border-slate-200 dark:border-slate-700 
           hover:bg-slate-50 dark:hover:bg-slate-700 
           shadow-sm hover:shadow-md`,
        ghost:
          `bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/70 
           text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100`,
        destructive:
          `bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 
           hover:bg-red-100 dark:hover:bg-red-900/30 border border-transparent`,
        link: "text-orange-600 underline-offset-4 hover:underline",
        outline:
          `bg-transparent border border-slate-200 dark:border-slate-700 
           text-slate-700 dark:text-slate-300 
           hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600`,
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      shape: {
        default: "rounded-xl",
        pill: "rounded-full",
        square: "rounded-md",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };