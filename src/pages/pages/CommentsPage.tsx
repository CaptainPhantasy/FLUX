// @ts-nocheck
import React from 'react';
import CommentStream from '@/components/CommentStream';
import { Card } from '@/components/ui';

const MOCK_COMMENTS = [
  {
    id: 'c1',
    content: 'Shipping timeline looks good. Can we add a QA buffer?',
    timestamp: '5m ago',
    author: { id: 'u1', name: 'Alex Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
    reactions: [{ emoji: '+1', count: 3, active: true }, { emoji: 'fire', count: 1, active: false }],
    replies: [
      {
        id: 'c1r1',
        content: 'Agreed. Proposing 2 extra days for regression.',
        timestamp: '2m ago',
        author: { id: 'u2', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
        reactions: [{ emoji: 'check', count: 1, active: true }],
        replies: [],
      }
    ],
  },
  {
    id: 'c2',
    content: 'Updated the onboarding flow copy per growth team feedback.',
    timestamp: '1h ago',
    author: { id: 'u3', name: 'Jordan Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan' },
    reactions: [{ emoji: 'heart', count: 2, active: false }],
    replies: [],
  }
];

export default function CommentsPage() {
  return (
    <div className="p-6 pt-16 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Comments</h1>
        <p className="text-muted-foreground">Threaded discussion stream with reactions.</p>
      </div>

      <Card variant="elevated" padding="lg" className="min-h-[500px]">
        <CommentStream comments={MOCK_COMMENTS} />
      </Card>
    </div>
  );
}

