import React from 'react';
import { Integration, Category, Asset } from './types';

// Brand SVG Components (Inline for portability and consistent styling)
export const SlackLogo = () => (
  <svg viewBox="0 0 128 128" className="w-full h-full">
    <path fill="#E01E5A" d="M28.67 61.56a14.33 14.33 0 1 1 14.33-14.33 14.33 14.33 0 0 1-14.33 14.33Zm0-4.1a10.23 10.23 0 1 0 10.23-10.23 10.23 10.23 0 0 0-10.23 10.23Z" />
    <path fill="#E01E5A" d="M38.9 65.66a14.33 14.33 0 1 1-14.33 14.33 14.33 14.33 0 0 1 14.33-14.33Zm4.1 0a10.23 10.23 0 1 0 10.23 10.23 10.23 10.23 0 0 0-10.23-10.23Z" />
    <path fill="#36C5F0" d="M65.66 28.67a14.33 14.33 0 1 1 14.33-14.33 14.33 14.33 0 0 1-14.33 14.33Zm-4.1 0a10.23 10.23 0 1 0-10.23-10.23 10.23 10.23 0 0 0 10.23 10.23Z" />
    <path fill="#36C5F0" d="M61.56 38.9a14.33 14.33 0 1 1-14.33 14.33 14.33 14.33 0 0 1 14.33-14.33Zm0 4.1a10.23 10.23 0 1 0-10.23 10.23 10.23 10.23 0 0 0 10.23-10.23Z" />
    <path fill="#2EB67D" d="M99.33 66.44a14.33 14.33 0 1 1-14.33 14.33 14.33 14.33 0 0 1 14.33-14.33Zm0 4.1a10.23 10.23 0 1 0-10.23 10.23 10.23 10.23 0 0 0 10.23-10.23Z" />
    <path fill="#2EB67D" d="M89.1 62.34a14.33 14.33 0 1 1 14.33-14.33 14.33 14.33 0 0 1-14.33 14.33Zm-4.1 0a10.23 10.23 0 1 0-10.23-10.23 10.23 10.23 0 0 0 10.23 10.23Z" />
    <path fill="#ECB22E" d="M62.34 99.33a14.33 14.33 0 1 1-14.33-14.33 14.33 14.33 0 0 1 14.33 14.33Zm4.1 0a10.23 10.23 0 1 0 10.23-10.23 10.23 10.23 0 0 0-10.23 10.23Z" />
    <path fill="#ECB22E" d="M66.44 89.1a14.33 14.33 0 1 1 14.33-14.33 14.33 14.33 0 0 1-14.33 14.33Zm0-4.1a10.23 10.23 0 1 0 10.23 10.23 10.23 10.23 0 0 0-10.23-10.23Z" />
  </svg>
);

export const JiraLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#0052CC]">
    <path fill="currentColor" d="M11.53 2C11.68 2.5 11.85 2.99 12.04 3.46C13.2 6.43 12.56 9.8 10.28 12.08L4.69 17.67C3.13 16.11 2.25 13.99 2.25 11.78C2.25 6.38 6.63 2 12.03 2H11.53Z" />
    <path fill="currentColor" d="M12.98 23.49L17.56 18.91C20.68 15.78 20.68 10.71 17.56 7.58L12.98 3.01C12.78 2.52 12.61 2.01 12.45 1.49C11.96 1.15 11.39 0.96 10.79 0.96C8.89 0.96 7.34 2.51 7.34 4.41V11.23L12.98 5.59L17.56 10.17C19.27 11.88 19.27 14.65 17.56 16.36L12.98 20.94V23.49Z" opacity="0.6" />
    <path fill="currentColor" d="M5.42 18.42L11 12.84C13.28 10.56 13.91 7.18 12.74 4.22L12.5 3.59L12.98 3.11L17.56 7.69C20.68 10.82 20.68 15.89 17.56 19.02L12.98 23.6H10.59C5.19 23.6 0.81 19.22 0.81 13.82C0.81 12.87 0.98 11.95 1.28 11.08C1.52 12.08 1.95 13.04 2.54 13.91L5.42 16.79V18.42Z" />
  </svg>
);

export const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-slate-900">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.05-.015-2.055-3.33.72-4.035-1.605-4.035-1.605-.54-1.38-1.335-1.755-1.335-1.755-1.08-.735.09-.72.09-.72 1.2.075 1.83 1.23 1.83 1.23 1.065 1.815 2.805 1.29 3.495.99.105-.78.42-1.29.765-1.59-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.545 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const NotionLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-slate-800">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.217-.793c1.633-.14 1.82.793 1.82 2.193v12.81c0 2.193-1.12 2.66-2.94 1.96l-12.833-5.04c-1.353-.56-1.82.047-1.82 1.213v2.894c0 1.073-.7 1.586-1.633.98L.308 18.767C-.252 18.394 0 17.507 0 16.667V4.954c0-.98.373-1.26 1.353-.84l3.106 1.307v-.094V4.208zm2.662 2.1l-.98 1.073v10.126l.98 1.073V6.308zm11.713-.373l-8.633.466v11.387l1.493.653 7.14-5.46V5.935z" />
  </svg>
);

export const LinearLogo = () => (
  <svg viewBox="0 0 128 128" className="w-full h-full">
    <path fill="#5E6AD2" d="M64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 99.3462 28.6538 128 64 128Z" />
    <path fill="#FFFFFF" d="M64 24C41.9086 24 24 41.9086 24 64C24 86.0914 41.9086 104 64 104C86.0914 104 104 86.0914 104 64C104 41.9086 86.0914 24 64 24ZM36 64C36 48.536 48.536 36 64 36C79.464 36 92 48.536 92 64C92 79.464 79.464 92 64 92C48.536 92 36 79.464 36 64Z" />
    <path fill="#FFFFFF" d="M64 24V64H104C104 41.9086 86.0914 24 64 24Z" opacity="0.5" />
  </svg>
);

export const GitLabLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#e24329" d="M22.65 14.39L18.8 2.55a.91.91 0 00-1.72 0L15.15 8.5H8.85L6.92 2.55a.91.91 0 00-1.72 0L1.35 14.39a.91.91 0 00.33.95l10.32 7.5 10.32-7.5a.91.91 0 00.33-.95z"/>
    <path fill="#fc6d26" d="M12 22.84l-10.32-7.5.33-.95L12 22.84z"/>
    <path fill="#fca326" d="M1.35 14.39l.68-2.09L12 22.84 1.35 14.39z"/>
    <path fill="#fc6d26" d="M12 22.84l10.32-7.5-.33-.95L12 22.84z"/>
    <path fill="#fca326" d="M22.65 14.39l-.68-2.09L12 22.84l10.65-8.45z"/>
  </svg>
);

export const FigmaLogo = () => (
  <svg viewBox="0 0 38 57" className="w-full h-full">
    <path fill="#19BCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" />
    <path fill="#0ACF83" d="M0 47.5c0 5.25 4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5V38H9.5C4.25 38 0 42.25 0 47.5Z" />
    <path fill="#FF7262" d="M19 0v19h9.5c5.25 0 9.5-4.25 9.5-9.5S33.75 0 28.5 0H19Z" />
    <path fill="#F24E1E" d="M0 9.5C0 14.75 4.25 19 9.5 19H19V0H9.5C4.25 0 0 4.25 0 9.5Z" />
    <path fill="#A259FF" d="M0 28.5C0 33.75 4.25 38 9.5 38H19V19H9.5C4.25 19 0 23.25 0 28.5Z" />
  </svg>
);


export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect to channels for real-time alerts and team collaboration.',
    icon: <SlackLogo />,
    category: Category.COMMUNICATION,
    brandColor: '#E01E5A',
    isConnected: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync repositories, issues, and pull requests directly into Flux.',
    icon: <GitHubLogo />,
    category: Category.DEV_TOOLS,
    brandColor: '#000000',
    isConnected: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Import tickets and sync status updates two-way.',
    icon: <JiraLogo />,
    category: Category.IMPORT,
    brandColor: '#0052CC',
    isConnected: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Streamline issue tracking with high-performance sync.',
    icon: <LinearLogo />,
    category: Category.IMPORT,
    brandColor: '#5E6AD2',
    isConnected: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Embed Flux dashboards into your Notion workspaces.',
    icon: <NotionLogo />,
    category: Category.COMMUNICATION,
    brandColor: '#333333',
    isConnected: true,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'DevOps lifecycle tool integration for CI/CD pipelines.',
    icon: <GitLabLogo />,
    category: Category.DEV_TOOLS,
    brandColor: '#FC6D26',
    isConnected: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Bring design prototypes into your Flux workflow context.',
    icon: <FigmaLogo />,
    category: Category.DESIGN,
    brandColor: '#A259FF',
    isConnected: false,
  },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Q3_Financial_Report.pdf',
    type: 'pdf',
    size: '2.4 MB',
    updatedAt: '2023-10-24T10:00:00Z',
    owner: {
      name: 'Sarah Chen',
      avatarUrl: 'https://picsum.photos/id/64/100/100',
    },
  },
  {
    id: '2',
    name: 'Hero_Banner_V2.png',
    type: 'image',
    size: '4.1 MB',
    updatedAt: '2023-10-23T15:30:00Z',
    owner: {
      name: 'Mike Ross',
      avatarUrl: 'https://picsum.photos/id/91/100/100',
    },
  },
  {
    id: '3',
    name: 'main.tsx',
    type: 'code',
    size: '12 KB',
    updatedAt: '2023-10-22T09:15:00Z',
    owner: {
      name: 'Alex T.',
      avatarUrl: 'https://picsum.photos/id/103/100/100',
    },
  },
  {
    id: '4',
    name: 'Project_Launch_Video.mp4',
    type: 'video',
    size: '154 MB',
    updatedAt: '2023-10-20T11:45:00Z',
    owner: {
      name: 'Sarah Chen',
      avatarUrl: 'https://picsum.photos/id/64/100/100',
    },
  },
  {
    id: '5',
    name: 'Budget_2024.xlsx',
    type: 'sheet',
    size: '45 KB',
    updatedAt: '2023-10-18T14:20:00Z',
    owner: {
      name: 'Jessica P.',
      avatarUrl: 'https://picsum.photos/id/177/100/100',
    },
  },
   {
    id: '6',
    name: 'Marketing_Assets',
    type: 'folder',
    size: '12 items',
    updatedAt: '2023-10-15T09:00:00Z',
    owner: {
      name: 'Mike Ross',
      avatarUrl: 'https://picsum.photos/id/91/100/100',
    },
  },
  {
    id: '7',
    name: 'User_Research_Q3.pdf',
    type: 'pdf',
    size: '1.2 MB',
    updatedAt: '2023-10-14T16:10:00Z',
    owner: {
      name: 'Emily Wong',
      avatarUrl: 'https://picsum.photos/id/342/100/100',
    },
  },
   {
    id: '8',
    name: 'Backend_API_Specs.ts',
    type: 'code',
    size: '24 KB',
    updatedAt: '2023-10-12T13:45:00Z',
    owner: {
      name: 'Alex T.',
      avatarUrl: 'https://picsum.photos/id/103/100/100',
    },
  },
];