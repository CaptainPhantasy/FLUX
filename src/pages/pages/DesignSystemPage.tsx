// @ts-nocheck
// =====================================
// FLUX - Design System Showcase
// Style: Glassmorphism & Glowing Accents
// Last Updated: 21:26:00 Dec 06, 2025
// =====================================

import React from 'react';
import { Button, Badge, Card } from '@/components/ui';
import { 
    Zap, 
    CheckCircle2, 
    AlertCircle, 
    Settings,
    ArrowRight
} from 'lucide-react';

export default function DesignSystemPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Flux Design System</h1>
                <p className="text-muted-foreground max-w-2xl">
                    A collection of reusable components designed with glassmorphism, clean typography, and consistent spacing.
                </p>
            </div>

            {/* Buttons */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Buttons</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary" size="lg">Primary Large</Button>
                    <Button variant="primary">Primary Default</Button>
                    <Button variant="primary" size="sm">Primary Small</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="secondary">Secondary Default</Button>
                    <Button variant="outline">Outline Default</Button>
                    <Button variant="ghost">Ghost Default</Button>
                    <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary">
                        <Zap size={16} className="mr-2" />
                        With Icon
                    </Button>
                    <Button variant="outline">
                        Next Step
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                    <Button variant="secondary" size="icon">
                        <Settings size={18} />
                    </Button>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Badges</h2>
                <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default Badge</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success Custom</Badge>
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Warning Custom</Badge>
                </div>
            </section>

            {/* Cards */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card padding="lg">
                        <h3 className="font-semibold mb-2">Default Card</h3>
                        <p className="text-sm text-muted-foreground">This is a standard card with padding and default styling.</p>
                    </Card>
                    
                    <Card padding="lg" variant="flat">
                        <h3 className="font-semibold mb-2">Flat Card</h3>
                        <p className="text-sm text-muted-foreground">A flat variant without elevation, useful for secondary content.</p>
                    </Card>

                    <Card padding="lg" className="border-violet-500/50 bg-violet-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap size={18} className="text-violet-500" />
                            <h3 className="font-semibold text-violet-600 dark:text-violet-400">Active Card</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Custom styled card for highlighting active or special states.</p>
                    </Card>
                </div>
            </section>

            {/* Colors */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Theme Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((weight) => (
                        <div key={weight} className="space-y-1.5">
                            <div className={`h-12 w-full rounded-lg bg-violet-${weight} shadow-sm border border-border`} />
                            <p className="text-xs text-muted-foreground text-center">Violet {weight}</p>
                        </div>
                    ))}
                </div>
            </section>

             <div className="text-xs text-slate-400 mt-12 border-t border-border pt-4 flex justify-between">
                 <span>Flux Design System Showcase</span>
                 <span>21:26:00 Dec 06, 2025</span>
            </div>
        </div>
    );
}

