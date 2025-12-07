// @ts-nocheck
// =====================================
// FLUX - Rich Text Editor (Stubbed)
// TipTap dependencies need to be installed
// =====================================

import React, { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Quote, Heading1, Heading2, Link2, Image, FileText } from 'lucide-react';

interface FluxEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

// Toolbar button component
const ToolbarButton = ({ icon: Icon, label, onClick, active = false }) => (
    <button
        type="button"
        onClick={onClick}
        title={label}
        className={`p-2 rounded-lg transition-colors ${
            active 
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
    >
        <Icon size={18} />
    </button>
);

export const FluxEditor: React.FC<FluxEditorProps> = ({
    content = '',
    onChange,
    placeholder = 'Start writing...',
    readOnly = false
}) => {
    const [value, setValue] = useState(content);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        onChange?.(e.target.value);
    };

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Toolbar */}
            {!readOnly && (
                <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Bold} label="Bold" onClick={() => {}} />
                        <ToolbarButton icon={Italic} label="Italic" onClick={() => {}} />
                        <ToolbarButton icon={Code} label="Code" onClick={() => {}} />
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => {}} />
                        <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => {}} />
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={List} label="Bullet List" onClick={() => {}} />
                        <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => {}} />
                        <ToolbarButton icon={Quote} label="Quote" onClick={() => {}} />
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Link2} label="Link" onClick={() => {}} />
                        <ToolbarButton icon={Image} label="Image" onClick={() => {}} />
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div className="p-4">
                <textarea
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className="w-full min-h-[300px] bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground font-sans leading-relaxed"
                    style={{ fontFamily: 'inherit' }}
                />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>{value.length} characters</span>
                    <span>•</span>
                    <span>{value.split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <div className="text-[10px] italic">
                    Rich text editing requires TipTap installation
                </div>
            </div>
        </div>
    );
};

export default FluxEditor;
