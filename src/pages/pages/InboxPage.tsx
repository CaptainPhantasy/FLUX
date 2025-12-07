// =====================================
// FLUX - Inbox (Notifications) Page
// Style: Clean Modern SaaS
// =====================================

// @ts-nocheck
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    CheckCheck,
    Inbox,
    Archive,
    AtSign,
    AlertCircle
} from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification, TabOption } from '@/types';
import { Card, Button, Badge } from '@/components/ui';

function NotificationItem({
    notification,
    onArchive,
    onMarkRead
}: {
    notification: Notification;
    onArchive: (id: string) => void;
    onMarkRead: (id: string) => void;
}) {
    const typeConfig = {
        mention: { icon: AtSign, color: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30' },
        task_update: { icon: CheckCheck, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
        pr_review: { icon: AlertCircle, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
        system: { icon: Bell, color: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800' },
        ai_suggestion: { icon: Bell, color: 'text-fuchsia-600 bg-fuchsia-100 dark:text-fuchsia-400 dark:bg-fuchsia-900/30' },
    };

    const config = typeConfig[notification.type] || typeConfig.system;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => !notification.isRead && onMarkRead(notification.id)}
        >
            <Card
                variant={notification.isRead ? "flat" : "hover"}
                padding="md"
                className={cn(
                    "flex items-start gap-4 transition-all group",
                    !notification.isRead && "bg-white border-violet-200 dark:border-violet-900/50 shadow-sm"
                )}
            >
                {/* Icon/Avatar */}
                <div className="flex-shrink-0 mt-1">
                    {notification.user?.avatar ? (
                        <div className="relative">
                            <img
                                src={notification.user.avatar}
                                alt={notification.user.name}
                                className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                            <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900", config.color)}>
                                <Icon size={10} strokeWidth={3} />
                            </div>
                        </div>
                    ) : (
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.color)}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm text-foreground leading-snug">
                            <span className="font-semibold">{notification.user?.name || 'System'}</span>
                            <span className="font-normal text-muted-foreground ml-1">
                                {notification.description}
                            </span>
                        </h4>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2 flex-shrink-0">
                            {formatRelativeTime(notification.createdAt)}
                        </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-1">
                        {!notification.isRead ? (
                            <Badge variant="primary" size="sm" className="bg-violet-50 text-violet-700 border-violet-100">Unread</Badge>
                        ) : (
                            <span className="text-xs text-slate-400">Read</span>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onArchive(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 h-7 px-2 text-slate-400 hover:text-slate-600"
                        >
                            <Archive size={14} className="mr-1.5" />
                            Archive
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export default function InboxPage() {
    const {
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        archiveNotification
    } = useFluxStore();

    const [activeTab, setActiveTab] = useState<TabOption>('all');

    const filteredNotifications = useMemo(() => {
        switch (activeTab) {
            case 'unread': return notifications.filter(n => !n.isRead);
            case 'mentions': return notifications.filter(n => n.type === 'mention');
            default: return notifications;
        }
    }, [notifications, activeTab]);

    const tabs: { id: TabOption; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'mentions', label: 'Mentions' },
        { id: 'unread', label: 'Unread' },
    ];

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto w-full p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        Inbox
                        {unreadCount > 0 && (
                            <Badge variant="danger" className="text-sm px-2">
                                {unreadCount} new
                            </Badge>
                        )}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your notifications and updates
                    </p>
                </div>

                <Button
                    variant="secondary"
                    size="md"
                    onClick={markAllNotificationsRead}
                    disabled={unreadCount === 0}
                    leftIcon={<CheckCheck size={16} />}
                >
                    Mark all read
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-border mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-3 text-sm font-medium transition-all relative",
                            activeTab === tab.id
                                ? "text-violet-600 dark:text-violet-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="inboxTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onArchive={archiveNotification}
                                onMarkRead={markNotificationRead}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-slate-400"
                        >
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Inbox size={32} />
                            </div>
                            <p className="font-medium">No notifications found</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
