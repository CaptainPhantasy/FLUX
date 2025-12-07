// =====================================
// FLUX - Dashboard Layout
// Style: Professional Glassmorphism + Ambient Depth
// =====================================

// @ts-nocheck
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import FluxSidebar from '@/components/sidebar/FluxSidebar';

export default function DashboardLayout() {
    return (
        <div className="flex w-screen h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden relative font-sans text-foreground transition-colors duration-300">

            {/* 
               Ambient Background Effects 
               Soft, large blurs to give depth and "premium" feel 
            */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muted/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />

            {/* Sidebar with Z-Index to sit above ambient backgrounds */}
            <FluxSidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </div>
            </main>

        </div>
    );
}
