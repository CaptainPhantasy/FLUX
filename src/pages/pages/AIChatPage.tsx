// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AIChat } from '@/components/AIChat';

export default function AIChatPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[70vh]">
      <AIChat onClose={() => navigate('/app/dashboard')} />
    </div>
  );
}

