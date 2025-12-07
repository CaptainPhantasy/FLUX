// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { FileText, Plus, MoreHorizontal, Search, FileCode, FileImage, Download, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DOCUMENTS = [
    { id: 1, title: 'Project Specification.md', type: 'markdown', updated: '2 hours ago', author: 'Alex Morgan' },
    { id: 2, title: 'API Documentation', type: 'code', updated: 'Yesterday', author: 'Sarah Miller' },
    { id: 3, title: 'Q4 Marketing Strategy', type: 'text', updated: '3 days ago', author: 'Alex Morgan' },
    { id: 4, title: 'Homepage Wireframes.fig', type: 'design', updated: '1 week ago', author: 'Design Team' },
    { id: 5, title: 'Release Notes v2.0', type: 'text', updated: 'Jan 12, 2024', author: 'DevOps' },
];

export default function DocumentsPage() {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleRowClick = (docTitle: string) => {
        // Placeholder for actual document opening logic
        alert(`Opening document: ${docTitle}`);
    };

    const toggleMenu = (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent row click
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                            <FileText className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Documents</h1>
                    </div>
                    <p className="text-muted-foreground">Manage your project documentation, specs, and resources.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-foreground placeholder-muted-foreground"
                        />
                    </div>
                    <Button onClick={() => alert("Create new document - Coming soon")}>
                        <Plus className="w-4 h-4 mr-2" /> New Doc
                    </Button>
                </div>
            </header>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="p-4 pl-6 text-xs font-semibold uppercase tracking-wider text-slate-400 font-medium">Name</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-medium">Type</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-medium">Updated</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-medium">Author</th>
                            <th className="p-4 pr-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {DOCUMENTS.map((doc) => (
                            <tr
                                key={doc.id}
                                onClick={() => handleRowClick(doc.title)}
                                className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                            >
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-slate-500">
                                            {doc.type === 'markdown' && <FileText className="w-4 h-4 text-blue-500" />}
                                            {doc.type === 'code' && <FileCode className="w-4 h-4 text-violet-500" />}
                                            {doc.type === 'design' && <FileImage className="w-4 h-4 text-pink-500" />}
                                            {doc.type === 'text' && <FileText className="w-4 h-4 text-slate-500" />}
                                        </div>
                                        <span className="font-medium text-card-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {doc.title}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="secondary" className="uppercase text-[10px]">
                                        {doc.type}
                                    </Badge>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {doc.updated}
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {doc.author}
                                </td>
                                <td className="p-4 pr-6 text-right relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        onClick={(e) => toggleMenu(e, doc.id)}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>

                                    {/* Dropdown Menu */}
                                    {activeMenuId === doc.id && (
                                        <div className="absolute right-8 top-8 w-48 bg-card rounded-xl shadow-xl border border-border z-50 flex flex-col py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); alert('Opening ' + doc.title); }}
                                            >
                                                <ExternalLink size={14} className="text-slate-400" /> Open
                                            </button>
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); alert('Editing ' + doc.title); }}
                                            >
                                                <Edit size={14} className="text-slate-400" /> Rename
                                            </button>
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); alert('Downloading ' + doc.title); }}
                                            >
                                                <Download size={14} className="text-slate-400" /> Download
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); alert('Deleting ' + doc.title); }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Empty State / Pagination Placeholder */}
                <div className="p-4 border-t border-border/50 flex justify-center">
                    <span className="text-xs text-slate-400">Showing 5 of 24 documents</span>
                </div>
            </div>
        </div>
    );
}
