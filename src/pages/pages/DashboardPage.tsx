// @ts-nocheck
// =====================================
// FLUX - Dashboard Page
// Style: Clean Modern SaaS (SlothUI)
// =====================================

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreHorizontal,
    ArrowRight,
    Sparkles,
    Zap,
    CheckSquare,
    Activity,
    Users,
    DollarSign,
    Filter,
    Plus
} from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@/components/ui';
import { CreateTaskModal, EditTaskModal } from '@/features/tasks';
import { useState } from 'react';
import type { Task } from '@/types';
import BackgroundGradientAnimation from '@/components/ui/BackgroundGradientAnimation';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, tasks, notifications, openTerminal, clearAllNotifications } = useFluxStore();
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    const filteredTasks = filterStatus 
        ? tasks.filter(t => t.status === filterStatus)
        : tasks;

    const stats = [
        { label: 'Total Tasks', value: tasks.length, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Urgent', value: tasks.filter(t => t.priority === 'high').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    const recentTasks = filteredTasks.slice(0, 4);

    return (
        <BackgroundGradientAnimation
            containerClassName="min-h-screen w-full"
            className="pointer-events-none"
            interactive={true}
        >
                <div className="w-full min-h-screen p-4 md:p-8">
                {/* Top controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-4 lg:px-6 py-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Welcome back, {user?.name?.split(' ')[0] || 'User'}
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">
                            Here's what's happening in your workspace today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={filterStatus || ''}
                                onChange={(e) => setFilterStatus(e.target.value || null)}
                                className="appearance-none bg-white dark:bg-[#1F1F2A]/80 border border-border rounded-xl px-4 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">All Tasks</option>
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                                <option value="backlog">Backlog</option>
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                        <Button variant="primary" size="default" onClick={() => setIsCreateTaskOpen(true)}>
                            <Plus size={16} />
                            <span className="ml-2">New Task</span>
                        </Button>
                    </div>
                </div>

                <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} />
                <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />

                {/* Content */}
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card 
                                    variant="elevated" 
                                    padding="md" 
                                    className="flex items-center gap-4 cursor-pointer"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-sm`}>
                                        <stat.icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <h2 className="text-2xl font-bold text-card-foreground">{stat.value}</h2>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Tasks */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Zap size={18} className="text-orange-500" />
                                    Recent Tasks
                                </h2>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-orange-600" onClick={() => navigate('/app/board')}>
                                    View all
                                </Button>
                            </div>

                            {recentTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {recentTasks.map((task, i) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-border/30 dark:bg-[#11111A]/85 hover:border-orange-300/70 transition-colors group cursor-pointer shadow-floating"
                                        >
                                            <div className="flex items-center gap-4 justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' :
                                                        task.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-300'
                                                        }`} />
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 dark:text-foreground group-hover:text-orange-600 transition-colors">
                                                            {task.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-600 dark:text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                                                            <span className="uppercase tracking-wider opacity-80 text-slate-700 dark:text-muted-foreground">{task.status.replace('-', ' ')}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-slate-600 dark:text-muted-foreground">{formatDate(task.dueDate)}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {task.priority === 'high' && (
                                                        <Badge variant="destructive">High</Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTask(task);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground bg-white text-slate-900 dark:bg-[#11111A]/85 rounded-2xl border border-slate-200 dark:border-border/30">
                                    No recent tasks found.
                                </div>
                            )}
                        </div>

                        {/* Notifications / Activity */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-500" />
                                    Activity Feed
                                </h2>
                                <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => clearAllNotifications()}>
                                    Clear
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 5).map((notif, i) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Card variant="hover" padding="sm" className="flex gap-3">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                                <div>
                                                    <p className="text-sm text-card-foreground leading-snug">
                                                        <span className="font-semibold text-foreground">{notif.title}</span> {notif.description}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1 font-medium">
                                                        {formatDate(notif.createdAt)}
                                                    </p>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                ) : (
                                    <Card padding="lg" variant="elevated" className="text-center">
                                        <p className="text-sm text-muted-foreground">All caught up!</p>
                                    </Card>
                                )}

                                <Button variant="outline" size="sm" className="w-full text-xs text-slate-500" onClick={() => openTerminal()}>
                                    View archived notifications
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BackgroundGradientAnimation>
    );
}
