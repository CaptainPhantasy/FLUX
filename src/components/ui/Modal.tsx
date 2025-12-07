// @ts-nocheck
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    size = 'md'
}: ModalProps) {

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
        full: 'max-w-[95vw] h-[90vh]'
    };

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop - buttery smooth fade */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Modal Content - smooth spring animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 28,
                                mass: 0.8,
                            }
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.96, 
                            y: 8,
                            transition: {
                                duration: 0.15,
                                ease: [0.4, 0, 1, 1],
                            }
                        }}
                        className={cn(
                            "relative w-full bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
                            sizeClasses[size],
                            className
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                            <motion.h2 
                                className="text-xl font-bold text-card-foreground tracking-tight"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
                            >
                                {title}
                            </motion.h2>
                            <motion.button
                                onClick={onClose}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                                whileHover={{ scale: 1.05, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Body */}
                        <motion.div 
                            className="flex-1 overflow-y-auto p-6 scrollbar-thin"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05, duration: 0.2, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
