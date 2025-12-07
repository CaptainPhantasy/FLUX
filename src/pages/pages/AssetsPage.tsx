// @ts-nocheck
// =====================================
// FLUX - Assets Page
// Style: Clean Modern SaaS
// =====================================

import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from '@tanstack/react-table';
import {
    Upload,
    Search,
    FileImage,
    FileText,
    File,
    Trash2,
    Download,
    Grid3X3,
    List,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useFluxStore } from '@/lib/store';
import { cn, formatFileSize, formatDate } from '@/lib/utils';
import type { Asset } from '@/types';
import { Card } from '@/components/ui';

const columnHelper = createColumnHelper<Asset>();

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
}

export default function AssetsPage() {
    const { assets, uploadAsset, deleteAsset } = useFluxStore();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        setIsUploading(true);
        for (const file of files) {
            await uploadAsset(file);
        }
        setIsUploading(false);
    }, [uploadAsset]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        for (const file of Array.from(files)) {
            await uploadAsset(file);
        }
        setIsUploading(false);
        e.target.value = '';
    }, [uploadAsset]);

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Name',
            cell: info => {
                const Icon = getFileIcon(info.row.original.mimeType);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                            {info.row.original.mimeType.startsWith('image/') ? (
                                <img
                                    src={info.row.original.url}
                                    alt={info.getValue()}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Icon className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-card-foreground truncate max-w-[200px]">
                                {info.getValue()}
                            </p>
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{info.row.original.type}</p>
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('size', {
            header: 'Size',
            cell: info => (
                <span className="text-sm text-slate-500 font-mono">
                    {formatFileSize(info.getValue())}
                </span>
            ),
        }),
        columnHelper.accessor('uploadedAt', {
            header: 'Uploaded',
            cell: info => (
                <span className="text-sm text-slate-500">
                    {formatDate(info.getValue())}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            cell: info => (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <a
                        href={info.row.original.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <Download size={16} />
                    </a>
                    <button
                        onClick={() => deleteAsset(info.row.original.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        }),
    ], [deleteAsset]);

    const table = useReactTable({
        data: assets,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="h-full flex flex-col p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Assets</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {assets.length} file{assets.length !== 1 ? 's' : ''} stored in cloud
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 w-64 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-200 transition-all shadow-sm text-foreground"
                        />
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                    {/* View Toggle */}
                    <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'p-1.5 rounded-lg transition-all',
                                viewMode === 'table'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-1.5 rounded-lg transition-all',
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <Grid3X3 size={16} />
                        </button>
                    </div>

                    {/* Upload Button */}
                    <label className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-lg shadow-violet-500/20 active:translate-y-0.5">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </label>
                </div>
            </div>

            {/* Drop Zone / Content */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-hidden flex flex-col"
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
            >
                {assets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 m-1">
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-border flex items-center justify-center">
                            <Upload className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">
                            No assets yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm text-center px-4">
                            Drag and drop files here to upload them to your project storage.
                        </p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1">
                        <div className="overflow-y-auto h-full">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-muted/50 border-b border-border z-10">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th
                                                    key={header.id}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className={cn(
                                                        "px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider",
                                                        header.column.getCanSort() && "cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: <ChevronUp className="w-3 h-3" />,
                                                            desc: <ChevronDown className="w-3 h-3" />,
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="px-6 py-4">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-y-auto pb-20">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {assets.map(asset => {
                                const Icon = getFileIcon(asset.mimeType);
                                return (
                                    <Card
                                        key={asset.id}
                                        variant="hover"
                                        padding="none"
                                        className="group overflow-hidden"
                                    >
                                        <div className="aspect-square bg-muted border-b border-border flex items-center justify-center relative">
                                            {asset.mimeType.startsWith('image/') ? (
                                                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                                            )}

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <button
                                                    onClick={() => deleteAsset(asset.id)}
                                                    className="p-2 bg-white text-slate-900 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <a
                                                    href={asset.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white text-slate-900 rounded-lg hover:text-violet-600 transition-colors"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-semibold text-card-foreground truncate" title={asset.name}>
                                                {asset.name}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-muted px-1.5 py-0.5 rounded">
                                                    {asset.type}
                                                </span>
                                                <span className="text-xs text-slate-400">{formatFileSize(asset.size)}</span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Upload Indicator */}
            {isUploading && (
                <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 bg-card rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-border z-50">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-card-foreground">Uploading...</span>
                </div>
            )}
        </div>
    );
}
