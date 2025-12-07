// @ts-nocheck
// =====================================
// FLUX - Board (Kanban) Page
// Style: Clean Modern SaaS
// =====================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, SlidersHorizontal, Search } from 'lucide-react';
import { FluxBoard } from '@/features/kanban';
import { CreateTaskModal } from '@/features/tasks/CreateTaskModal';
import { useFluxStore } from '@/lib/store';
import { Button } from '@/components/ui';

export default function BoardPage() {
    const { openTerminal, tasks, currentProjectId, projects } = useFluxStore();

    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');

    const activeTasks = tasks.filter(t => t.status !== 'archived');
    const filteredTasks = activeTasks.filter(task =>
        task.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

    return (
        <div className="h-full flex flex-col">
            {/* Header - Transparent / Clean */}
            <div className="flex items-center justify-between px-8 py-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        {currentProject?.name || 'Project'} Board
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in progress
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter tasks..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-200 w-64 shadow-sm transition-all text-foreground"
                        />
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    {/* Actions */}
                    <Button variant="secondary" size="default" onClick={() => openTerminal()}>
                        <Filter size={16} />
                        <span className="ml-2 hidden sm:inline">Filter</span>
                    </Button>

                    <Button variant="secondary" size="default" className="px-3" onClick={() => openTerminal()}>
                        <SlidersHorizontal size={16} />
                    </Button>

                    {/* Add Task Button */}
                    <Button
                        onClick={() => setIsCreateTaskOpen(true)}
                        variant="primary"
                        size="default"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Board Container */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-6"
            >
                <div className="h-full min-w-full inline-flex">
                    <FluxBoard tasks={filteredTasks} />
                </div>
            </motion.div>

            <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
        </div>
    );
}
