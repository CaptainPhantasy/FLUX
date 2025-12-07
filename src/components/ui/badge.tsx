import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-violet-100 text-violet-700 hover:bg-violet-100/80",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-100/80",
        outline: "text-slate-700 border border-slate-200",
        // Semantic Variants
        todo: "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200",
        inprogress:
          "border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100",
        done:
          "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        bug:
          "border-transparent bg-red-50 text-red-700 hover:bg-red-100",
        critical:
          "border-transparent bg-orange-50 text-orange-700 hover:bg-orange-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };