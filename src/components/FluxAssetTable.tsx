import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  FileText,
  Image as ImageIcon,
  Code,
  Film,
  FileSpreadsheet,
  MoreHorizontal,
  Folder,
  File as FileGeneric,
  UploadCloud,
  Check,
  ArrowUpDown,
  Download,
  Trash2,
  Share2
} from 'lucide-react';
import { Asset, FileType } from '../types';

// --- Constants & Helpers ---

const getFileIcon = (type: FileType) => {
  switch (type) {
    case 'pdf':
      return { icon: FileText, bg: 'bg-red-100', text: 'text-red-600' };
    case 'image':
      return { icon: ImageIcon, bg: 'bg-purple-100', text: 'text-purple-600' };
    case 'code':
      return { icon: Code, bg: 'bg-blue-100', text: 'text-blue-600' };
    case 'video':
      return { icon: Film, bg: 'bg-orange-100', text: 'text-orange-600' };
    case 'sheet':
      return { icon: FileSpreadsheet, bg: 'bg-emerald-100', text: 'text-emerald-600' };
    case 'folder':
      return { icon: Folder, bg: 'bg-slate-100', text: 'text-slate-600' };
    default:
      return { icon: FileGeneric, bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

interface FluxAssetTableProps {
  initialData: Asset[];
}

const columnHelper = createColumnHelper<Asset>();

export const FluxAssetTable: React.FC<FluxAssetTableProps> = ({ initialData }) => {
  const [data, setData] = useState<Asset[]>(initialData);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDragging, setIsDragging] = useState(false);

  // --- Drag & Drop Handlers ---

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulation of file drop - in a real app, we'd process e.dataTransfer.files
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newAssets: Asset[] = files.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        type: file.type.includes('image') ? 'image' : 'unknown',
        size: '0 KB',
        updatedAt: new Date().toISOString().split('T')[0],
        owner: {
          name: 'You',
          avatarUrl: 'https://picsum.photos/32/32?grayscale'
        }
      }));
      setData(prev => [...newAssets, ...prev]);
    }
  }, []);

  // --- Columns Configuration ---

  const columns = useMemo(
    () => [
      // Selection Column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center pl-4">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center pl-4">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
        size: 48,
      }),

      // File Name Column
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-slate-700 transition-colors"
            onClick={column.getToggleSortingHandler()}
          >
            NAME
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </button>
        ),
        cell: ({ row }) => {
          const asset = row.original;
          const style = getFileIcon(asset.type);
          const Icon = style.icon;

          return (
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{asset.name}</span>
                <span className="text-xs text-slate-400">{asset.size}</span>
              </div>
            </div>
          );
        },
      }),

      // Modified Date Column
      columnHelper.accessor('updatedAt', {
        header: ({ column }) => (
           <button
            className="flex items-center gap-1 hover:text-slate-700 transition-colors"
            onClick={column.getToggleSortingHandler()}
          >
            DATE MODIFIED
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-slate-500 text-sm font-medium">
            {new Date(getValue() as string).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ),
      }),

      // Owner Column
      columnHelper.accessor('owner', {
        header: 'OWNER',
        cell: ({ getValue }) => {
          const owner = getValue();
          return (
            <div className="flex items-center gap-2">
              <img
                src={owner.avatarUrl}
                alt={owner.name}
                className="w-6 h-6 rounded-full ring-2 ring-white"
              />
              <span className="text-sm text-slate-600">{owner.name}</span>
            </div>
          );
        },
      }),

      // Actions Column
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: () => (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end pr-4">
            <div className="flex items-center gap-1">
                 <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors" aria-label="Share">
                    <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors" aria-label="Download">
                    <Download className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors" aria-label="More options">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // --- Render ---

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      
      {/* Upload Zone */}
      <div 
        className={`
          m-6 mb-2 p-8 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center gap-3 cursor-pointer
          ${isDragging 
            ? 'border-violet-500 bg-violet-50/50 scale-[1.01] shadow-inner' 
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300
          ${isDragging ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}
        `}>
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-center">
            <p className={`font-medium transition-colors duration-300 ${isDragging ? 'text-violet-700' : 'text-slate-700'}`}>
                {isDragging ? 'Drop files to upload' : 'Click or drag files to upload'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
                Supported: PDF, IMG, CODE, SHEET, VIDEO
            </p>
        </div>
      </div>

      {/* Toolbar / Bulk Actions */}
      {Object.keys(rowSelection).length > 0 && (
         <div className="px-6 py-2 bg-violet-50 border-y border-violet-100 flex items-center justify-between text-violet-900 text-sm animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="font-semibold">{Object.keys(rowSelection).length} selected</span>
            </div>
            <div className="flex items-center gap-3">
                <button className="hover:underline opacity-80 hover:opacity-100">Download</button>
                <button className="hover:underline opacity-80 hover:opacity-100 text-red-600 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                </button>
            </div>
         </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-slate-100">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="py-4 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase bg-transparent select-none first:pl-4 last:pr-4"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-sm">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`
                  group h-16 transition-colors border-b border-slate-50 last:border-none
                  ${row.getIsSelected() ? 'bg-violet-50/60' : 'hover:bg-slate-50'}
                `}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 first:pl-4 last:pr-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
            <div className="p-12 text-center text-slate-400">
                <p>No assets found. Upload some files to get started.</p>
            </div>
        )}
      </div>
      
      {/* Footer / Pagination stub */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Showing {table.getRowModel().rows.length} of {data.length} assets</span>
        <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
             <button className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  );
};
