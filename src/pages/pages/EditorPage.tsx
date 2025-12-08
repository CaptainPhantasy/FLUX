// @ts-nocheck
import React, { useState } from 'react';
import { Card } from '@/components/ui';
import FluxEditor from '@/components/FluxEditor';

export default function EditorPage() {
  const [content, setContent] = useState('<p>Start writing your masterpiece...</p>');

  return (
    <div className="p-6 pt-16 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Flux Editor</h1>
        <p className="text-muted-foreground">Rich text editing with slash commands and code blocks.</p>
      </div>

      <Card variant="elevated" padding="lg" className="min-h-[500px]">
        <FluxEditor
          initialContent={content}
          onUpdate={(html) => setContent(html)}
        />
      </Card>

      <Card variant="flat" padding="md" className="text-sm text-muted-foreground">
        <p className="font-semibold mb-1">Live HTML Output</p>
        <pre className="whitespace-pre-wrap break-words text-xs">{content}</pre>
      </Card>
    </div>
  );
}

