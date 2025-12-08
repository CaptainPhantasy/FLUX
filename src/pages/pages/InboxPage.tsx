// =====================================
// FLUX - Email Inbox Page
// Style: Clean Modern SaaS
// Last Updated: 18:50:31 Dec 07, 2025
// =====================================

// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Search,
    Trash2,
    Archive,
    Star,
    StarOff,
    Inbox,
    Send,
    Folder,
    Settings,
    Plus,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Reply,
    ReplyAll,
    Forward,
    X,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    MailOpen,
    Mail as MailIcon,
    Paperclip,
    FileText,
} from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, Button, Badge } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import type { Email, EmailFolder, EmailAccount } from '@/types';
import BackgroundGradientAnimation from '@/components/ui/BackgroundGradientAnimation';

const FOLDERS: { id: EmailFolder; label: string; icon: typeof Inbox }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'spam', label: 'Spam', icon: AlertCircle },
    { id: 'trash', label: 'Trash', icon: Trash2 },
];

function EmailListItem({
    email,
    isSelected,
    onClick,
    onStar,
    onDelete,
    onArchive,
    onMarkRead,
}: {
    email: Email;
    isSelected: boolean;
    onClick: () => void;
    onStar: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onMarkRead: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "group relative p-4 border-b border-border cursor-pointer transition-all",
                isSelected && "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
                !email.isRead && !isSelected && "bg-white dark:bg-slate-900/50 border-l-4 border-l-violet-500",
                "hover:bg-muted/50"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Star/Unread indicator */}
                <div className="flex flex-col items-center gap-1 mt-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStar();
                        }}
                        className={cn(
                            "p-1 rounded hover:bg-muted transition-colors",
                            email.isStarred && "text-amber-500"
                        )}
                    >
                        {email.isStarred ? (
                            <Star size={16} className="fill-current" />
                        ) : (
                            <StarOff size={16} className="text-muted-foreground" />
                        )}
                    </button>
                    {!email.isRead && (
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                    )}
                </div>

                {/* Email content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                                "font-semibold text-sm truncate",
                                !email.isRead && "font-bold text-foreground",
                                email.isRead && "text-muted-foreground"
                            )}>
                                {email.fromName || email.fromAddress}
                            </span>
                            {email.labels && email.labels.length > 0 && (
                                <div className="flex gap-1">
                                    {email.labels.slice(0, 2).map((label, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatRelativeTime(email.receivedAt)}
                        </span>
                    </div>
                    <p className={cn(
                        "text-sm truncate mb-1",
                        !email.isRead ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                        {email.subject || '(No Subject)'}
                    </p>
                    {email.bodyText && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {email.bodyText.substring(0, 100)}
                            {email.bodyText.length > 100 && '...'}
                        </p>
                    )}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Paperclip size={12} />
                            <span>{email.attachments.length} attachment{email.attachments.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead();
                        }}
                        className="h-8 w-8 p-0"
                    >
                        {email.isRead ? <MailIcon size={14} /> : <MailOpen size={14} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onArchive();
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <Archive size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

function EmailDetailView({
    email,
    onClose,
    onStar,
    onDelete,
    onArchive,
    onMarkRead,
    onReply,
    onReplyAll,
    onForward,
}: {
    email: Email | null;
    onClose: () => void;
    onStar: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onMarkRead: () => void;
    onReply: () => void;
    onReplyAll: () => void;
    onForward: () => void;
}) {
    if (!email) return null;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="h-full flex flex-col bg-card border-l border-border"
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
                        <ChevronLeft size={20} />
                    </Button>
                    <h2 className="text-lg font-semibold">Email</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onStar}
                        className={email.isStarred ? "text-amber-500" : ""}
                    >
                        {email.isStarred ? <Star size={18} className="fill-current" /> : <StarOff size={18} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onArchive}>
                        <Archive size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                        <Trash2 size={18} />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Subject */}
                    <div>
                        <h1 className="text-2xl font-bold mb-4">{email.subject || '(No Subject)'}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {!email.isRead && (
                                <Badge variant="primary" className="text-xs">Unread</Badge>
                            )}
                            {email.isStarred && (
                                <Badge variant="secondary" className="text-xs">Starred</Badge>
                            )}
                            {email.labels && email.labels.map((label, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{label}</Badge>
                            ))}
                        </div>
                    </div>

                    {/* From/To */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-muted-foreground w-20">From:</span>
                            <span className="flex-1">{email.fromName || email.fromAddress} &lt;{email.fromAddress}&gt;</span>
                        </div>
                        {email.toAddresses && email.toAddresses.length > 0 && (
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-muted-foreground w-20">To:</span>
                                <span className="flex-1">{email.toAddresses.join(', ')}</span>
                            </div>
                        )}
                        {email.ccAddresses && email.ccAddresses.length > 0 && (
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-muted-foreground w-20">CC:</span>
                                <span className="flex-1">{email.ccAddresses.join(', ')}</span>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-muted-foreground w-20">Date:</span>
                            <span className="flex-1">{new Date(email.receivedAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" onClick={onReply}>
                            <Reply size={16} className="mr-2" />
                            Reply
                        </Button>
                        <Button variant="outline" size="sm" onClick={onReplyAll}>
                            <ReplyAll size={16} className="mr-2" />
                            Reply All
                        </Button>
                        <Button variant="outline" size="sm" onClick={onForward}>
                            <Forward size={16} className="mr-2" />
                            Forward
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="pt-4 border-t border-border">
                        {email.bodyHtml ? (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                            />
                        ) : (
                            <div className="whitespace-pre-wrap text-sm text-foreground">
                                {email.bodyText || '(No content)'}
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="pt-4 border-t border-border">
                            <h3 className="font-semibold mb-3">Attachments ({email.attachments.length})</h3>
                            <div className="space-y-2">
                                {email.attachments.map((attachment, idx) => (
                                    <Card key={idx} padding="sm" className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                                <FileText size={20} className="text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{attachment.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(attachment.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        {attachment.url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                                    Download
                                                </a>
                                            </Button>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function InboxPage() {
    const navigate = useNavigate();
    const {
        emails,
        emailAccounts,
        selectedEmailId,
        selectedAccountId,
        currentFolder,
        searchQuery,
        isLoadingEmails,
        unreadEmailCount,
        fetchEmails,
        searchEmails,
        setSelectedEmail,
        setCurrentFolder,
        setSearchQuery,
        markEmailRead,
        markEmailStarred,
        archiveEmail,
        deleteEmail,
        moveEmailToFolder,
        fetchEmailAccounts,
        fetchUnreadEmailCount,
    } = useFluxStore();

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showDetailView, setShowDetailView] = useState(false);

    useEffect(() => {
        fetchEmailAccounts();
        fetchEmails();
        fetchUnreadEmailCount();
    }, []);

    const selectedEmail = useMemo(() => {
        return emails.find(e => e.id === selectedEmailId) || null;
    }, [emails, selectedEmailId]);

    const filteredEmails = useMemo(() => {
        let filtered = emails;

        // Filter by folder
        filtered = filtered.filter(e => e.folder === currentFolder && !e.isDeleted);

        // Filter by search query
        if (localSearchQuery) {
            const query = localSearchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.subject.toLowerCase().includes(query) ||
                e.fromAddress.toLowerCase().includes(query) ||
                e.fromName?.toLowerCase().includes(query) ||
                e.bodyText?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [emails, currentFolder, localSearchQuery]);

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email.id);
        setShowDetailView(true);
        if (!email.isRead) {
            markEmailRead(email.id, true);
        }
    };

    const handleSearch = (query: string) => {
        setLocalSearchQuery(query);
        if (query) {
            searchEmails(query, currentFolder);
        } else {
            fetchEmails(selectedAccountId || undefined, currentFolder);
        }
    };

    const handleDelete = async (emailId: string) => {
        await deleteEmail(emailId);
        if (selectedEmailId === emailId) {
            setSelectedEmail(null);
            setShowDetailView(false);
        }
    };

    const handleArchive = async (emailId: string) => {
        await archiveEmail(emailId, true);
        if (selectedEmailId === emailId) {
            setSelectedEmail(null);
            setShowDetailView(false);
        }
    };

    const handleStar = async (emailId: string) => {
        const email = emails.find(e => e.id === emailId);
        if (email) {
            await markEmailStarred(emailId, !email.isStarred);
        }
    };

    const handleMarkRead = async (emailId: string) => {
        const email = emails.find(e => e.id === emailId);
        if (email) {
            await markEmailRead(emailId, !email.isRead);
        }
    };

    const handleReply = () => {
        // TODO: Implement reply functionality
        console.log('Reply to:', selectedEmail?.id);
    };

    const handleReplyAll = () => {
        // TODO: Implement reply all functionality
        console.log('Reply all to:', selectedEmail?.id);
    };

    const handleForward = () => {
        // TODO: Implement forward functionality
        console.log('Forward:', selectedEmail?.id);
    };

    return (
        <BackgroundGradientAnimation
            containerClassName="h-screen w-full"
            className="pointer-events-none"
            interactive
        >
            <div className="h-full flex flex-col bg-background">
                {/* Header */}
                <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <Mail className="text-violet-500" />
                                Inbox
                                {unreadEmailCount > 0 && (
                                    <Badge variant="primary" className="text-sm px-2">
                                        {unreadEmailCount} unread
                                    </Badge>
                                )}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {emailAccounts.length === 0
                                    ? 'No email accounts connected. Connect an account to get started.'
                                    : `${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''} in ${currentFolder}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {emailAccounts.length === 0 ? (
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/app/appearance')}
                                    leftIcon={<Plus size={16} />}
                                >
                                    Connect Email Account
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            fetchEmails(selectedAccountId || undefined, currentFolder);
                                            fetchUnreadEmailCount();
                                        }}
                                    >
                                        <RefreshCw size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/app/appearance')}
                                    >
                                        <Settings size={16} />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={localSearchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        {localSearchQuery && (
                            <button
                                onClick={() => handleSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-border bg-card/50 flex flex-col">
                        {/* Folders */}
                        <div className="p-4 space-y-1">
                            {FOLDERS.map((folder) => {
                                const Icon = folder.icon;
                                const count = emails.filter(e => e.folder === folder.id && !e.isDeleted).length;
                                const unreadCount = emails.filter(e => e.folder === folder.id && !e.isDeleted && !e.isRead).length;

                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => {
                                            setCurrentFolder(folder.id);
                                            setShowDetailView(false);
                                            setSelectedEmail(null);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            currentFolder === folder.id
                                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} />
                                            <span>{folder.label}</span>
                                        </div>
                                        {unreadCount > 0 && folder.id === 'inbox' && (
                                            <Badge variant="primary" className="text-xs px-1.5">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Email Accounts */}
                        {emailAccounts.length > 0 && (
                            <div className="p-4 border-t border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                    Accounts
                                </h3>
                                <div className="space-y-1">
                                    {emailAccounts.map((account) => (
                                        <button
                                            key={account.id}
                                            onClick={() => {
                                                // TODO: Implement account switching
                                                console.log('Switch to account:', account.id);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                                selectedAccountId === account.id
                                                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <div className="truncate">{account.emailAddress}</div>
                                            <div className="text-xs opacity-70 truncate">{account.provider}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Email List */}
                    <div className="flex-1 flex overflow-hidden">
                        <div className={cn(
                            "flex-1 overflow-y-auto",
                            showDetailView && "hidden md:block"
                        )}>
                            {isLoadingEmails ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Loading emails...</p>
                                    </div>
                                </div>
                            ) : filteredEmails.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Mail size={32} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {localSearchQuery ? 'No emails found' : `No emails in ${currentFolder}`}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {localSearchQuery
                                            ? 'Try adjusting your search terms'
                                            : emailAccounts.length === 0
                                                ? 'Connect an email account to get started'
                                                : 'Your emails will appear here'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    <AnimatePresence>
                                        {filteredEmails.map((email) => (
                                            <EmailListItem
                                                key={email.id}
                                                email={email}
                                                isSelected={selectedEmailId === email.id}
                                                onClick={() => handleEmailClick(email)}
                                                onStar={() => handleStar(email.id)}
                                                onDelete={() => handleDelete(email.id)}
                                                onArchive={() => handleArchive(email.id)}
                                                onMarkRead={() => handleMarkRead(email.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Email Detail View */}
                        {showDetailView && selectedEmail && (
                            <EmailDetailView
                                email={selectedEmail}
                                onClose={() => {
                                    setShowDetailView(false);
                                    setSelectedEmail(null);
                                }}
                                onStar={() => handleStar(selectedEmail.id)}
                                onDelete={() => handleDelete(selectedEmail.id)}
                                onArchive={() => handleArchive(selectedEmail.id)}
                                onMarkRead={() => handleMarkRead(selectedEmail.id)}
                                onReply={handleReply}
                                onReplyAll={handleReplyAll}
                                onForward={handleForward}
                            />
                        )}
                    </div>
                </div>
            </div>
        </BackgroundGradientAnimation>
    );
}
