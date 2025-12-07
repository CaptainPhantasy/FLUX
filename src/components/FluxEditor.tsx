// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  List, 
  CheckSquare, 
  ImageIcon,
  Terminal,
  Quote
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { EditorProps } from '../types';

// Setup lowlight for code blocks
const lowlight = createLowlight(common);

const FluxEditor: React.FC<EditorProps> = ({ initialContent, readOnly, onUpdate }) => {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuLocation, setSlashMenuLocation] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Bubble Menu State
  const [bubbleMenuOpen, setBubbleMenuOpen] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // We use the lowlight extension
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialContent || '<p>Start writing your masterpiece...</p>',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[200px] selection:bg-violet-100 selection:text-violet-900',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
      
      // Robust Slash Command Logic
      const { state, view } = editor;
      const { selection } = state;
      const { $from } = selection;
      
      // Get the text in the current node up to the cursor
      const parentText = $from.parent.textContent;
      const textBeforeCursor = parentText.slice(0, $from.parentOffset);
      
      if (textBeforeCursor.endsWith('/')) {
        const { top, left } = view.coordsAtPos($from.pos);
        setSlashMenuLocation({ top, left });
        setSlashMenuOpen(true);
      } else if (slashMenuOpen && !textBeforeCursor.includes('/')) {
        // Close if the slash is deleted
        setSlashMenuOpen(false);
      }
    },
    onSelectionUpdate: ({ editor }) => {
        const { selection } = editor.state;
        const { empty } = selection;
        
        if (empty) {
            setBubbleMenuOpen(false);
            return;
        }

        // Use browser selection to get the bounding rect for positioning
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Avoid showing if rect is invalid or off-screen in a weird way
            if (rect.width === 0) {
                setBubbleMenuOpen(false);
                return;
            }

            setBubbleMenuPosition({
                top: rect.top,
                left: rect.left + rect.width / 2
            });
            setBubbleMenuOpen(true);
        }
    },
    onBlur: () => {
      // Small delay to allow clicking the menu
      setTimeout(() => setSlashMenuOpen(false), 200);
    }
  });

  const runCommand = useCallback((command: () => void) => {
    // Delete the slash before running command
    if (editor) {
      const { state, dispatch } = editor.view;
      const { $from } = state.selection;
      
      // Remove the slash character before the cursor
      const tr = state.tr.delete($from.pos - 1, $from.pos);
      dispatch(tr);
      
      command();
      editor.commands.focus();
      setSlashMenuOpen(false);
    }
  }, [editor]);

  const items = [
    {
      label: 'Heading 1',
      icon: <Heading1 size={18} />,
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 size={18} />,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Task List',
      icon: <CheckSquare size={18} />,
      action: () => editor?.chain().focus().toggleTaskList().run(),
    },
    {
      label: 'Bullet List',
      icon: <List size={18} />,
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Code Block',
      icon: <Terminal size={18} />,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: 'Quote',
      icon: <Quote size={18} />,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Image',
      icon: <ImageIcon size={18} />,
      action: () => {
        const url = window.prompt('Enter image URL:', 'https://picsum.photos/800/400');
        if (url) editor?.chain().focus().setImage({ src: url }).run();
      },
    },
  ];

  // Handle keyboard navigation in slash menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!slashMenuOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runCommand(items[selectedIndex].action);
      } else if (e.key === 'Escape') {
        setSlashMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slashMenuOpen, selectedIndex, items, runCommand]);


  if (!editor) return null;

  return (
    <div className="relative w-full">
      {/* Custom Bubble Menu */}
      {bubbleMenuOpen && (
        <div 
            className="fixed z-50 flex items-center gap-1 p-1 bg-white border border-slate-200 shadow-xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: bubbleMenuPosition.top - 50, // Above selection
                left: bubbleMenuPosition.left,
                transform: 'translateX(-50%)'
            }}
            onMouseDown={(e) => {
                // Prevent stealing focus from editor
                e.preventDefault();
            }}
        >
        <MenuButton 
          active={editor.isActive('bold')} 
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton 
          active={editor.isActive('italic')} 
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton 
          active={editor.isActive('strike')} 
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </MenuButton>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <MenuButton 
          active={editor.isActive('heading', { level: 1 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton 
          active={editor.isActive('heading', { level: 2 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </MenuButton>
        <MenuButton 
          active={editor.isActive('codeBlock')} 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={16} />
        </MenuButton>
      </div>
      )}

      {/* Main Editor Canvas */}
      <div 
        className="flux-editor-container"
        onClick={() => editor.commands.focus()}
      >
         <style>{`
          /* Custom Caret Color */
          .ProseMirror {
            caret-color: #7c3aed; /* violet-600 */
          }
          /* Task List Styles */
          ul[data-type="taskList"] {
            list-style: none;
            padding: 0;
          }
          ul[data-type="taskList"] li {
            display: flex;
            align-items: center;
          }
          ul[data-type="taskList"] li > label {
            margin-right: 0.5rem;
            user-select: none;
          }
          ul[data-type="taskList"] li > div {
            flex: 1;
          }
          /* Placeholder */
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #94a3b8;
            pointer-events: none;
            height: 0;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Slash Command Popover */}
      {slashMenuOpen && (
        <Popover.Root open={true}>
          <Popover.Anchor 
            className="fixed w-0 h-0"
            style={{ 
              top: slashMenuLocation.top + 24, // Offset slightly below cursor
              left: slashMenuLocation.left 
            }} 
          />
          <Popover.Content 
            className="z-50 min-w-[220px] bg-white rounded-xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-100"
            sideOffset={5}
            align="start"
          >
            <div className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 uppercase tracking-wider">
              Basic Blocks
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => runCommand(item.action)}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors text-left w-full
                    ${index === selectedIndex 
                      ? 'bg-violet-50 text-violet-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className={`p-1 rounded ${index === selectedIndex ? 'bg-violet-100' : 'bg-slate-100 text-slate-500'}`}>
                    {item.icon}
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Root>
      )}
    </div>
  );
};

// Helper for bubble menu buttons
const MenuButton = ({ children, onClick, active }: { children: React.ReactNode, onClick: () => void, active?: boolean }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded transition-colors ${
      active 
        ? 'bg-violet-100 text-violet-700' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);

export default FluxEditor;
