import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../providers/ThemeProvider';
import {
  LayoutDashboard,
  CheckCircle2,
  KanbanSquare,
  Map as MapIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  Plus,
  Folder,
  Zap,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  BarChart3,
  Import
} from 'lucide-react';

const FluxSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
    { icon: KanbanSquare, label: 'Task Board', path: '/app/board' },
    { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
    { icon: Folder, label: 'Assets', path: '/app/assets' },
    { icon: Zap, label: 'Integrations', path: '/app/integrations' },
    { icon: Import, label: 'Import', path: '/app/import' },
    { icon: Settings, label: 'Setup Wizard', path: '/setup' },
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
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl
      `}
    >
      {/* Header Section */}
      <div className="p-4 flex flex-col gap-4 relative">
        {/* Toggle Button - positioned absolutely to always be accessible */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm z-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Area */}
        <div className="flex items-center gap-3 h-10 overflow-hidden">
          <motion.div 
            variants={logoVariants}
            className="flex-shrink-0 w-10 h-10 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-none stroke-current stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-9 6 18 3-9h3" />
            </svg>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white"
              >
                Flux
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Project Switcher */}
        <div className={`
          flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors
          ${isCollapsed ? 'justify-center' : 'bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
        `}>
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold">
            P
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Platform Redesign</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Acme Inc.</span>
              </div>
              <ChevronsUpDown size={14} className="text-slate-400" />
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
                 placeholder="Search..." 
                 className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg focus:ring-1 focus:ring-violet-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
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
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                      ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 shadow-sm ring-1 ring-violet-200 dark:ring-violet-800' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
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

                      {/* Active Indicator Dot for Icon Only Mode */}
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
         {/* Add New Button (Only visible when Expanded usually, or icon when collapsed) */}
         <button className={`
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
                 Create Issue
               </motion.span>
            )}
         </button>

        <div className={`
          flex items-center gap-3 p-2 rounded-2xl transition-all duration-300
          ${isCollapsed ? 'justify-center' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800'}
        `}>
          <div className="relative flex-shrink-0">
            <img
              src="https://picsum.photos/100/100"
              alt="User"
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
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Alex Morgan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">alex@flux.io</p>
            </motion.div>
          )}

          {!isCollapsed && (
            <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors ${isSettingsOpen ? 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300' : ''}`}
                >
                <Settings size={16} />
                </button>

                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Theme</div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                          <button
                            onClick={() => setTheme('light')}
                            className={`flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="Light Mode"
                          >
                            <Sun size={14} />
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="Dark Mode"
                          >
                            <Moon size={14} />
                          </button>
                          <button
                            onClick={() => setTheme('system')}
                            className={`flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="System Preference"
                          >
                            <Monitor size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <User size={16} />
                            Profile Settings
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                            <LogOut size={16} />
                            Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default FluxSidebar;