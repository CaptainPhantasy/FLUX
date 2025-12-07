import React from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  tag: string;
  tagColor: string; // Tailwind color class suffix e.g., 'blue-500'
  members: string[]; // URLs to avatars
  progress: number;
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
}