// A simplified version of clsx + tailwind-merge for this standalone environment
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}