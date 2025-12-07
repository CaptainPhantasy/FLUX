// =====================================
// FLUX - Sidebar Navigation
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFluxStore } from '@/lib/store';
import {
    LayoutDashboard,
    CheckCircle2,
    KanbanSquare,
    FolderOpen,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    Inbox,
    ChevronsUpDown,
    Search,
    ShieldAlert,
    Rocket,
    Bot,
    FileUp,
    Palette,
    BarChart3,
    Plug,
    FileBox
} from 'lucide-react';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';

const FluxSidebar: React.FC = () => {
    const { sidebarCollapsed, toggleSidebar, user, projects, currentProjectId, setCurrentProject, fetchProjects } = useFluxStore();
    const isCollapsed = sidebarCollapsed;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch projects on mount
    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects();
        }
    }, [fetchProjects, projects.length]);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
        { icon: KanbanSquare, label: 'Task Board', path: '/app/board' },
        { icon: Rocket, label: 'Sprints', path: '/app/sprints' },
        { icon: ShieldAlert, label: 'Service Desk', path: '/app/service-desk' },
        { icon: Bot, label: 'Automation', path: '/app/automation' },
        { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
        { icon: FileBox, label: 'Assets', path: '/app/assets' },
        { icon: Inbox, label: 'Inbox', path: '/app/inbox' },
        { icon: FolderOpen, label: 'Documents', path: '/app/documents' },
        { icon: Plug, label: 'Integrations', path: '/app/integrations' },
        { icon: FileUp, label: 'Import', path: '/app/import' },
        { icon: Palette, label: 'Design System', path: '/app/design' },
    ];

    const sidebarVariants = {
        expanded: { width: 260 },
        collapsed: { width: 80 },
    };

    const logoVariants = {
        expanded: { scale: 1, opacity: 1 },
        collapsed: { scale: 0.8, opacity: 1 },
    };

    return (
        <motion.aside
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
        relative h-[calc(100vh-2rem)] m-4 mr-2 rounded-3xl z-50 flex flex-col flex-shrink-0
                bg-card/80 backdrop-blur-xl border border-border shadow-2xl
      `}
        >
            {/* Header Section */}
            <div className="p-4 flex flex-col gap-4 relative">
                {/* Toggle Button - positioned absolutely to always be accessible */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-8 w-6 h-6 bg-card rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 shadow-sm z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo Area - Using Real Logo */}
                <div className="flex items-center gap-3 h-10 overflow-hidden">
                    <motion.div
                        variants={logoVariants}
                        className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-violet-500/20"
                    >
                        <img 
                            src="/flux-logo-nopadding.jpeg" 
                            alt="Flux" 
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="font-bold text-2xl tracking-tight text-foreground"
                            >
                                Flux
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Project Switcher */}
                <div
                    onClick={() => !isCollapsed && setCurrentProject(projects.find(p => p.id !== currentProjectId)?.id || null)}
                    className={`
          flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors
          ${isCollapsed ? 'justify-center' : 'bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
        `}>
                    <div
                        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-white font-bold"
                        style={{ backgroundColor: projects.find(p => p.id === currentProjectId)?.color || '#6366f1' }}
                    >
                        {projects.find(p => p.id === currentProjectId)?.name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-card-foreground">
                                    {projects.find(p => p.id === currentProjectId)?.name || 'Select Project'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {projects.find(p => p.id === currentProjectId)?.description || 'Choose a project'}
                                </span>
                            </div>
                            {projects.length > 1 && <ChevronsUpDown size={14} className="text-slate-400" />}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {!isCollapsed && (
                    <div className="px-3 mb-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        window.location.href = `/app/board?search=${encodeURIComponent(searchQuery.trim())}`;
                                    }
                                }}
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 border-none rounded-lg focus:ring-1 focus:ring-violet-500 text-card-foreground placeholder-slate-400"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    {!isCollapsed && (
                        <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Workspace
                        </h3>
                    )}

                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/app'}
                                    className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 shadow-sm ring-1 ring-violet-200 dark:ring-violet-800'
                                            : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                        }
                  `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon
                                                size={20}
                                                className={`
                          flex-shrink-0 transition-colors
                          ${isActive ? 'text-violet-600 dark:text-violet-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'}
                        `}
                                                strokeWidth={isActive ? 2.5 : 2}
                                            />

                                            {!isCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="font-medium whitespace-nowrap"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}

                                            {isCollapsed && isActive && (
                                                <motion.div
                                                    layoutId="activeDot"
                                                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-violet-500"
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Footer / User Section */}
            <div className="p-3 mt-auto">
                {/* Add New Task Button */}
                <button
                    onClick={() => setIsCreateTaskOpen(true)}
                    className={`
            w-full flex items-center justify-center gap-2 p-2.5 mb-4 rounded-xl 
            bg-slate-900 dark:bg-white text-white dark:text-slate-900 
            hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/20
          `}>
                    <Plus size={20} />
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            className="font-semibold text-sm whitespace-nowrap"
                        >
                            Create Task
                        </motion.span>
                    )}
                </button>

                <div className={`
          flex items-center gap-3 p-2 rounded-2xl transition-all duration-300
          ${isCollapsed ? 'justify-center' : 'bg-muted/50 border border-border'}
        `}>
                    <div className="relative flex-shrink-0">
                        <img
                            src={user?.avatar || "https://picsum.photos/100/100"}
                            alt={user?.name || "User"}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                    </div>

                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Guest'}</h4>
                        </motion.div>
                    )}

                    {!isCollapsed && (
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <Settings size={16} />
                        </button>
                    )}
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
        </motion.aside>
    );
};

export default FluxSidebar;
// 21:11:22 Dec 06, 2025
