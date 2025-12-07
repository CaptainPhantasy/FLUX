import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DatabaseOptionCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  recommended?: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const DatabaseOptionCard: React.FC<DatabaseOptionCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  recommended,
  selected,
  onSelect,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <motion.div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      className={cn(
        "relative group cursor-pointer rounded-3xl border p-6 transition-all duration-500 ease-out outline-none",
        "bg-white/[0.03] backdrop-blur-xl",
        "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        selected 
          ? "border-violet-500/50 shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)] bg-white/[0.08]" 
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      {/* Selection Glow Gradient Background (Subtle) */}
      <div className={cn(
        "absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 transition-opacity duration-500",
        selected && "opacity-100"
      )} />

      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-violet-500/40 tracking-wider uppercase border border-white/10">
            Recommended
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center space-y-5">
        {/* Icon Container */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
          selected 
            ? "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-300 shadow-violet-500/10" 
            : "bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:bg-white/10"
        )}>
          <Icon size={32} strokeWidth={1.5} className="transition-transform duration-500 group-hover:scale-110" />
        </div>

        <div className="space-y-2">
          <h3 className={cn(
            "text-lg font-semibold tracking-tight transition-colors duration-300", 
            selected ? "text-white" : "text-slate-200"
          )}>
            {title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-[220px] mx-auto font-light">
            {description}
          </p>
        </div>

        {/* Radio Indicator */}
        <div className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-2",
          selected 
            ? "border-violet-500 bg-violet-600 text-white scale-110 shadow-lg shadow-violet-600/30" 
            : "border-slate-700 bg-transparent opacity-30 group-hover:opacity-100 group-hover:border-slate-500"
        )}>
          <motion.div
            initial={false}
            animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <CheckCircle2 size={14} strokeWidth={3} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};