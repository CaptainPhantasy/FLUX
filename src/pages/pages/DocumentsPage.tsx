// @ts-nocheck
import { useState, useRef, useCallback } from 'react';
import { FileText, Plus, MoreHorizontal, Search, FileCode, FileImage, Download, Edit, Trash2, ExternalLink, Upload, File, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface Document {
    id: string;
    title: string;
    type: 'markdown' | 'code' | 'design' | 'text' | 'pdf' | 'other';
    content?: string;
    url?: string;
    size: number;
    createdAt: string;
    updatedAt: string;
}

// Local storage helpers
const STORAGE_KEY = 'flux_documents';

const getDocuments = (): Document[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveDocuments = (docs: Document[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
};

const getFileType = (filename: string): Document['type'] => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['md', 'markdown'].includes(ext)) return 'markdown';
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css'].includes(ext)) return 'code';
    if (['fig', 'sketch', 'psd', 'ai', 'xd'].includes(ext)) return 'design';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['txt', 'doc', 'docx', 'rtf'].includes(ext)) return 'text';
    if (['csv', 'xls', 'xlsx'].includes(ext)) return 'text';
    if (['tif', 'tiff', 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return 'design';
    return 'other';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
};

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>(getDocuments);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;
        setIsUploading(true);

        const newDocs: Document[] = [];
        
        for (const file of Array.from(files)) {
            // Read file content for text files
            let content = '';
            if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
                content = await file.text();
            }

            const newDoc: Document = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: file.name,
                type: getFileType(file.name),
                content,
                url: URL.createObjectURL(file),
                size: file.size,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            newDocs.push(newDoc);
        }

        const updatedDocs = [...documents, ...newDocs];
        setDocuments(updatedDocs);
        saveDocuments(updatedDocs);
        setIsUploading(false);
    }, [documents]);

    const handleDelete = (id: string) => {
        const updatedDocs = documents.filter(d => d.id !== id);
        setDocuments(updatedDocs);
        saveDocuments(updatedDocs);
        setActiveMenuId(null);
    };

    const handleDownload = (doc: Document) => {
        if (doc.url) {
            const a = document.createElement('a');
            a.href = doc.url;
            a.download = doc.title;
            a.click();
        } else if (doc.content) {
            const blob = new Blob([doc.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.title;
            a.click();
            URL.revokeObjectURL(url);
        }
        setActiveMenuId(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFileUpload(e.dataTransfer.files);
    }, [handleFileUpload]);

    const getIcon = (type: Document['type']) => {
        switch (type) {
            case 'markdown': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'code': return <FileCode className="w-4 h-4 text-violet-500" />;
            case 'design': return <FileImage className="w-4 h-4 text-pink-500" />;
            case 'pdf': return <File className="w-4 h-4 text-red-500" />;
            default: return <FileText className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div 
            className="min-h-screen p-8 max-w-7xl mx-auto"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                            <FolderOpen className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Documents</h1>
                    </div>
                    <p className="text-muted-foreground">Upload, manage, and organize your project documents.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-foreground placeholder-muted-foreground shadow-sm"
                        />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Upload
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />
                </div>
            </header>

            {documents.length === 0 ? (
                <Card variant="elevated" padding="none" className="min-h-[400px] flex flex-col items-center justify-center">
                    <div className="text-center p-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No documents yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Drag and drop files here or click upload to add your first document.
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <Plus className="w-4 h-4 mr-2" /> Upload Document
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card variant="elevated" padding="none" className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="p-4 pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</th>
                                <th className="p-4 pr-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredDocs.map((doc, i) => (
                                <motion.tr
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDoc(doc)}
                                >
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                                {getIcon(doc.type)}
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
                                    <td className="p-4 text-sm text-muted-foreground font-mono">
                                        {formatFileSize(doc.size)}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {formatDate(doc.updatedAt)}
                                    </td>
                                    <td className="p-4 pr-6 text-right relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                                            }}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>

                                        {activeMenuId === doc.id && (
                                            <div 
                                                className="absolute right-8 top-8 w-48 bg-card rounded-xl shadow-overlay border border-border z-50 flex flex-col py-1 overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted flex items-center gap-2"
                                                    onClick={() => handleDownload(doc)}
                                                >
                                                    <Download size={14} className="text-muted-foreground" /> Download
                                                </button>
                                                <div className="h-px bg-border my-1" />
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                    onClick={() => handleDelete(doc.id)}
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 border-t border-border/50 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Drag & drop files anywhere to upload
                        </span>
                    </div>
                </Card>
            )}

            {/* Upload indicator */}
            {isUploading && (
                <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 bg-card rounded-xl shadow-overlay border border-border z-50">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-card-foreground">Uploading...</span>
                </div>
            )}

            {/* Document preview modal */}
            {selectedDoc && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedDoc(null)}
                >
                    <Card 
                        variant="elevated" 
                        padding="lg" 
                        className="max-w-2xl w-full max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    {getIcon(selectedDoc.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{selectedDoc.title}</h3>
                                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedDoc.size)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDoc)}>
                                    <Download size={14} className="mr-1" /> Download
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                                    ✕
                                </Button>
                            </div>
                        </div>
                        {selectedDoc.content && selectedDoc.content.length < 200000 ? (
                            <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto max-h-[400px] text-foreground whitespace-pre-wrap break-words">
                                {selectedDoc.content}
                            </pre>
                        ) : selectedDoc.type === 'design' || selectedDoc.type === 'image' ? (
                            <div className="p-2 bg-muted rounded-lg text-center">
                                <img src={selectedDoc.url} alt={selectedDoc.title} className="max-h-[400px] mx-auto object-contain" />
                            </div>
                        ) : (
                            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                                Preview not available for this file type
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
