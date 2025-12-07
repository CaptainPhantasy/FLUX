// @ts-nocheck
// =====================================
// FLUX - Appearance & Theme Control (eo-n components)
// Last Updated: 05:24:05 Dec 07, 2025
// =====================================

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button, Card } from '@/components/ui';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';

export default function AppearancePage() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          Appearance
        </p>
        <h1 className="text-3xl font-bold text-foreground">Light / Dark Control</h1>
        <p className="text-muted-foreground max-w-2xl">
          Toggle Flux between light, dark, or system mode. Components below use the eo-n Sheet
          and our buttons to validate styling across themes.
        </p>
      </div>

      <Card padding="lg" className="space-y-6 shadow-floating">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant={theme === 'light' ? 'primary' : 'secondary'}
            onClick={() => setTheme('light')}
          >
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            onClick={() => setTheme('dark')}
          >
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'primary' : 'secondary'}
            onClick={() => setTheme('system')}
          >
            System
          </Button>
          <Button variant="outline" onClick={toggleTheme}>
            Cycle (current: {theme})
          </Button>
          <span className="text-sm text-muted-foreground">
            Resolved: <span className="font-medium text-foreground">{resolvedTheme}</span>
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card padding="md" className="space-y-3 bg-card shadow-elevated">
            <h3 className="text-lg font-semibold">Surface preview</h3>
            <p className="text-sm text-muted-foreground">
              Verify cards, text, and shadows align with the active palette.
            </p>
            <div className="flex gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </Card>

          <Card padding="md" className="space-y-3 shadow-elevated">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">eo-n Sheet preview</h3>
                <p className="text-sm text-muted-foreground">
                  Opens a sheet with the current theme.
                </p>
              </div>
              <Sheet>
                <SheetTrigger>
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="data-[side=left]:max-w-[240px] data-[side=left]:w-[70vw]"
                >
                  <SheetHeader>
                    <SheetTitle>Navigation Preview</SheetTitle>
                    <SheetDescription>Respects light/dark modes.</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 px-2 py-2">
                    {['Dashboard', 'Board', 'Service Desk', 'Automation'].map((label) => (
                      <Button key={label} variant="ghost" className="justify-start text-sm">
                        {label}
                      </Button>
                    ))}
                  </div>
                  <SheetClose>
                    <Button variant="outline" className="mt-4 w-full">
                      Close
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            </div>
          </Card>
        </div>
      </Card>

      <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-border">
        Theme control demo for eo-n components. Last updated 05:24:05 Dec 07, 2025.
      </div>
    </div>
  );
}
// 05:24:05 Dec 07, 2025

