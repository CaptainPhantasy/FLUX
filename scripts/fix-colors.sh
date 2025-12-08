#!/bin/bash
# Systematic color replacement script

# Replace common patterns
find src -name "*.tsx" -type f -exec sed -i '' \
  -e 's/text-slate-900 dark:text-white/text-foreground/g' \
  -e 's/text-slate-900 dark:text-slate-100/text-foreground/g' \
  -e 's/text-slate-800 dark:text-white/text-foreground/g' \
  -e 's/text-slate-800 dark:text-slate-100/text-foreground/g' \
  -e 's/text-slate-700 dark:text-slate-200/text-card-foreground/g' \
  -e 's/text-slate-700 dark:text-slate-300/text-card-foreground/g' \
  -e 's/text-slate-600 dark:text-slate-300/text-muted-foreground/g' \
  -e 's/text-slate-600 dark:text-slate-400/text-muted-foreground/g' \
  -e 's/text-slate-500 dark:text-slate-400/text-muted-foreground/g' \
  -e 's/text-slate-500 dark:text-slate-300/text-muted-foreground/g' \
  -e 's/bg-slate-50 dark:bg-slate-900/bg-muted/g' \
  -e 's/bg-slate-50 dark:bg-slate-800/bg-muted/g' \
  -e 's/bg-slate-100 dark:bg-slate-800/bg-muted/g' \
  -e 's/bg-slate-100 dark:bg-slate-900/bg-muted/g' \
  -e 's/border-slate-200 dark:border-slate-800/border-border/g' \
  -e 's/border-slate-200 dark:border-slate-700/border-border/g' \
  -e 's/border-slate-100 dark:border-slate-800/border-border/g' \
  -e 's/border-slate-100 dark:border-slate-700/border-border/g' \
  {} +

echo "Color replacement complete!"
