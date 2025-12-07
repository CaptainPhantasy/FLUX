// @ts-nocheck
import React from 'react';
import { Comment } from '../types';
import { Reply, ThumbsUp, Heart, Smile } from 'lucide-react';

interface CommentStreamProps {
  comments: Comment[];
}

const CommentNode: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply }) => {
  return (
    <div className={`relative group ${isReply ? 'mt-3' : 'mb-6'}`}>
      {/* Thread Line - Only if there are replies or if strictly inside a thread context logic needed. 
          Here we implement visual nesting via margin and border. */}
      
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img 
            src={comment.author.avatar} 
            alt={comment.author.name} 
            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
          />
        </div>

        {/* Content Bubble */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">{comment.author.name}</span>
            <span className="text-xs text-slate-400">{comment.timestamp}</span>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-transparent hover:border-slate-200 transition-colors text-slate-700 text-sm leading-relaxed shadow-sm">
            {comment.content}
          </div>

          {/* Actions & Reactions */}
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors">
              <Reply size={12} /> Reply
            </button>
            
            {/* Reaction Pills */}
            <div className="flex items-center gap-1.5">
                {comment.reactions.map((r, idx) => (
                    <button 
                        key={idx}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                            r.active 
                            ? 'bg-violet-50 border-violet-200 text-violet-700 font-medium' 
                            : 'bg-white border-slate-100 text-slate-500 opacity-60 hover:opacity-100'
                        }`}
                    >
                        <span>{r.emoji}</span>
                        {r.count > 0 && <span>{r.count}</span>}
                    </button>
                ))}
                {/* Add reaction button - visible on hover of group */}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500">
                    <Smile size={14} />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-slate-100">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentStream: React.FC<CommentStreamProps> = ({ comments }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Comments</h3>
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
            {comments.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-2 custom-scrollbar">
        {comments.map((comment) => (
          <CommentNode key={comment.id} comment={comment} />
        ))}
      </div>
      
      {/* Scrollbar hide utility */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default CommentStream;
